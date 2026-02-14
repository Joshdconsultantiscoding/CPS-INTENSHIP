import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { extractText, detectMimeType } from '@/lib/ai/document-processor';
import { chunkText } from '@/lib/ai/chunker';
import { generateEmbeddings } from '@/lib/ai/embeddings';

export const maxDuration = 300; // 5 minutes for 4 PDFs

export async function POST(request: NextRequest) {
    try {
        const { internId } = await request.json();

        if (!internId) {
            return NextResponse.json({ error: 'internId is required' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // 1. Fetch mandatory documents
        const { data: record, error: fetchError } = await supabase
            .from('intern_documents')
            .select('*')
            .eq('intern_id', internId)
            .single();

        if (fetchError || !record) {
            return NextResponse.json({ error: 'Document record not found' }, { status: 404 });
        }

        const docsToProcess = [
            { url: record.learning_plan_url, type: 'learning_plan', title: 'Learning Plan' },
            { url: record.expectation_plan_url, type: 'expectation_plan', title: 'Expectation Plan' },
            { url: record.earning_plan_url, type: 'earning_plan', title: 'Earning Plan' },
            { url: record.internship_plan_url, type: 'internship_plan', title: 'Comprehensive Internship Plan' },
        ].filter(d => !!d.url);

        const results = [];

        for (const docInfo of docsToProcess) {
            try {
                // Determine file details from URL
                const fileName = docInfo.url!.split('/').pop() || `${docInfo.type}.pdf`;
                const mimeType = 'application/pdf'; // We enforce PDF in UI

                // 1. Create document record
                const { data: docRecord, error: insertError } = await supabase
                    .from('ai_knowledge_documents')
                    .insert({
                        title: `${docInfo.title} (Intern: ${internId})`,
                        file_name: fileName,
                        file_size_bytes: 0, // Unknown without HEAD request
                        mime_type: mimeType,
                        doc_scope: 'intern',
                        doc_type: docInfo.type,
                        authority_level: 2,
                        intern_id: internId,
                        status: 'processing',
                        uploaded_by: 'system',
                    })
                    .select('id')
                    .single();

                if (insertError) throw insertError;

                // 2. Fetch file content
                const fileRes = await fetch(docInfo.url!);
                if (!fileRes.ok) throw new Error(`Failed to download ${docInfo.type}`);
                const buffer = Buffer.from(await fileRes.arrayBuffer());

                // 3. Extract text
                const rawText = await extractText(buffer, mimeType, fileName);

                // 4. Chunk
                const chunks = chunkText(rawText, {
                    maxTokens: 512,
                    overlapTokens: 50,
                    docType: docInfo.type,
                    authorityLevel: 2,
                    internId: internId,
                });

                if (chunks.length > 0) {
                    // 5. Embed
                    const chunkTexts = chunks.map(c => c.content);
                    const embeddings = await generateEmbeddings(chunkTexts);

                    // 6. Store chunks
                    const chunkInserts = chunks.map((chunk, i) => ({
                        document_id: docRecord.id,
                        chunk_index: chunk.index,
                        content: chunk.content,
                        token_count: chunk.tokenCount,
                        embedding: JSON.stringify(embeddings[i]),
                        doc_scope: 'intern',
                        doc_type: docInfo.type,
                        authority_level: 2,
                        intern_id: internId,
                        metadata: chunk.metadata,
                    }));

                    for (let i = 0; i < chunkInserts.length; i += 50) {
                        await supabase.from('ai_document_chunks').insert(chunkInserts.slice(i, i + 50));
                    }

                    // 7. Update status
                    await supabase
                        .from('ai_knowledge_documents')
                        .update({
                            status: 'indexed',
                            chunk_count: chunks.length,
                            raw_text: rawText.slice(0, 50000),
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', docRecord.id);

                    results.push({ type: docInfo.type, status: 'success', chunks: chunks.length });
                }
            } catch (err: any) {
                console.error(`Error indexing ${docInfo.type}:`, err);
                results.push({ type: docInfo.type, status: 'error', error: err.message });
            }
        }

        // Final update to intern_documents
        await supabase
            .from('intern_documents')
            .update({
                knowledge_indexed: true,
                indexed_at: new Date().toISOString(),
            })
            .eq('intern_id', internId);

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        console.error("AI Intern Indexing Route Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
