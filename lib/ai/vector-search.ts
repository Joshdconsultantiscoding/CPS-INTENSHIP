// Vector Search Engine
// Queries Supabase pgvector for relevant document chunks

import { createAdminClient } from '@/lib/supabase/server';
import { generateQueryEmbedding } from './embeddings';

export interface SearchResult {
    id: string;
    document_id: string;
    content: string;
    chunk_index: number;
    doc_scope: string;
    doc_type: string;
    authority_level: number;
    intern_id: string | null;
    metadata: Record<string, any>;
    similarity: number;
}

export interface SearchFilters {
    scope?: 'global' | 'intern';
    internId?: string;
    docType?: string;
    limit?: number;
    threshold?: number;
}

/**
 * Search the knowledge base for relevant chunks
 * Uses Supabase pgvector RPC function for cosine similarity search
 */
export async function searchKnowledgeBase(
    query: string,
    filters: SearchFilters = {},
): Promise<SearchResult[]> {
    const queryEmbedding = await generateQueryEmbedding(query);
    const supabase = await createAdminClient();

    const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_count: filters.limit || 10,
        filter_scope: filters.scope || null,
        filter_intern_id: filters.internId || null,
        filter_doc_type: filters.docType || null,
        similarity_threshold: filters.threshold || 0.5,
    });

    if (error) {
        console.error('[VectorSearch] Search failed:', error.message);
        return [];
    }

    return (data || []) as SearchResult[];
}

/**
 * Search for global master knowledge (Layer 1 - highest authority)
 */
export async function searchGlobalKnowledge(
    query: string,
    limit: number = 8,
): Promise<SearchResult[]> {
    return searchKnowledgeBase(query, {
        scope: 'global',
        limit,
        threshold: 0.4, // lower threshold for global knowledge - cast wide net
    });
}

/**
 * Search for intern-specific knowledge (Layer 2)
 */
export async function searchInternKnowledge(
    query: string,
    internId: string,
    limit: number = 5,
): Promise<SearchResult[]> {
    return searchKnowledgeBase(query, {
        scope: 'intern',
        internId,
        limit,
        threshold: 0.45,
    });
}

/**
 * Multi-layer knowledge retrieval
 * Combines global + intern-specific results, sorted by authority then similarity
 */
export async function retrieveKnowledge(
    query: string,
    internId?: string,
): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Layer 1: Global master knowledge (always retrieve)
    const globalResults = await searchGlobalKnowledge(query);
    results.push(...globalResults);

    // Layer 2: Intern-specific knowledge (if intern context)
    if (internId) {
        const internResults = await searchInternKnowledge(query, internId);
        results.push(...internResults);
    }

    // Sort by authority level (1 = highest) then by similarity
    results.sort((a, b) => {
        if (a.authority_level !== b.authority_level) {
            return a.authority_level - b.authority_level;
        }
        return b.similarity - a.similarity;
    });

    return results;
}
