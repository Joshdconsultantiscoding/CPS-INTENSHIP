// Document Upload API – POST
// Accepts file upload → extracts text → chunks → generates embeddings → stores in vector DB

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { extractText, detectMimeType } from '@/lib/ai/document-processor';
import { chunkText } from '@/lib/ai/chunker';
import { generateEmbeddings } from '@/lib/ai/embeddings';

export const maxDuration = 120; // Allow up to 2 minutes for processing

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string;
        const docScope = formData.get('doc_scope') as string; // 'global' | 'intern'
        const docType = formData.get('doc_type') as string;
        const internId = formData.get('intern_id') as string | null;

        if (!file || !title || !docScope || !docType) {
            return NextResponse.json(
                { error: 'Missing required fields: file, title, doc_scope, doc_type' },
                { status: 400 },
            );
        }

        if (docScope === 'intern' && !internId) {
            return NextResponse.json(
                { error: 'intern_id is required for intern-scoped documents' },
                { status: 400 },
            );
        }

        // Check file size
        const supabase = await createAdminClient();
        const { data: settings } = await supabase
            .from('ai_settings')
            .select('max_file_size_mb')
            .limit(1)
            .single();

        const maxSizeMb = settings?.max_file_size_mb || 10;
        if (file.size > maxSizeMb * 1024 * 1024) {
            return NextResponse.json(
                { error: `File too large. Max size: ${maxSizeMb}MB` },
                { status: 400 },
            );
        }

        const mimeType = detectMimeType(file.name);
        const authorityLevel = docScope === 'global' ? 1 : 2;

        // 1. Create document record (status: processing)
        const { data: doc, error: insertError } = await supabase
            .from('ai_knowledge_documents')
            .insert({
                title,
                file_name: file.name,
                file_size_bytes: file.size,
                mime_type: mimeType,
                doc_scope: docScope,
                doc_type: docType,
                authority_level: authorityLevel,
                intern_id: internId || null,
                status: 'processing',
                uploaded_by: user.id,
            })
            .select('id')
            .single();

        if (insertError || !doc) {
            return NextResponse.json(
                { error: `Failed to create document: ${insertError?.message}` },
                { status: 500 },
            );
        }

        try {
            // 2. Extract text from file
            const buffer = Buffer.from(await file.arrayBuffer());
            const rawText = await extractText(buffer, mimeType, file.name);

            // 3. Chunk the text
            const chunks = chunkText(rawText, {
                maxTokens: 512,
                overlapTokens: 50,
                docType,
                authorityLevel,
                internId,
            });

            if (chunks.length === 0) {
                await supabase
                    .from('ai_knowledge_documents')
                    .update({ status: 'error', error_message: 'No text content could be extracted' })
                    .eq('id', doc.id);

                return NextResponse.json(
                    { error: 'No text content could be extracted from the file' },
                    { status: 400 },
                );
            }

            // 4. Generate embeddings for all chunks
            const chunkTexts = chunks.map(c => c.content);
            const embeddings = await generateEmbeddings(chunkTexts);

            // 5. Store chunks with embeddings
            const chunkInserts = chunks.map((chunk, i) => ({
                document_id: doc.id,
                chunk_index: chunk.index,
                content: chunk.content,
                token_count: chunk.tokenCount,
                embedding: JSON.stringify(embeddings[i]),
                doc_scope: docScope,
                doc_type: docType,
                authority_level: authorityLevel,
                intern_id: internId || null,
                metadata: chunk.metadata,
            }));

            // Insert in batches of 50
            for (let i = 0; i < chunkInserts.length; i += 50) {
                const batch = chunkInserts.slice(i, i + 50);
                const { error: chunkError } = await supabase
                    .from('ai_document_chunks')
                    .insert(batch);

                if (chunkError) {
                    console.error(`[DocUpload] Chunk batch ${i} failed:`, chunkError);
                }
            }

            // 6. Update document status to indexed
            await supabase
                .from('ai_knowledge_documents')
                .update({
                    status: 'indexed',
                    chunk_count: chunks.length,
                    raw_text: rawText.slice(0, 50000), // Store first 50k chars
                    updated_at: new Date().toISOString(),
                })
                .eq('id', doc.id);

            // 7. Log the action
            await supabase.from('ai_decision_logs').insert({
                action_type: 'document_analysis',
                input_summary: `Document uploaded: ${title} (${file.name})`,
                output_summary: `Processed ${chunks.length} chunks from ${docType} document`,
                triggered_by: user.id,
                is_autonomous: false,
                metadata: {
                    document_id: doc.id,
                    chunk_count: chunks.length,
                    file_size: file.size,
                    doc_scope: docScope,
                    doc_type: docType,
                },
            });

            return NextResponse.json({
                success: true,
                document_id: doc.id,
                chunk_count: chunks.length,
                status: 'indexed',
            });
        } catch (processingError: any) {
            // Update document status to error
            await supabase
                .from('ai_knowledge_documents')
                .update({
                    status: 'error',
                    error_message: processingError.message,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', doc.id);

            return NextResponse.json(
                { error: `Processing failed: ${processingError.message}` },
                { status: 500 },
            );
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
