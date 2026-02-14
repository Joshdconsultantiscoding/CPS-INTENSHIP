// Embedding Generation
// Uses AI SDK's embedding API to generate vector embeddings

import { embed, embedMany } from 'ai';
import { createModelInstance } from './model-adapter';

/**
 * Generate an embedding for a single text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const { embeddingModel } = await createModelInstance();

    const result = await embed({
        model: embeddingModel,
        value: text,
    });

    return result.embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * Processes in batches of 100 to respect API limits
 */
export async function generateEmbeddings(
    texts: string[],
): Promise<number[][]> {
    if (texts.length === 0) return [];

    const { embeddingModel } = await createModelInstance();
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        const result = await embedMany({
            model: embeddingModel,
            values: batch,
        });

        allEmbeddings.push(...result.embeddings);
    }

    return allEmbeddings;
}

/**
 * Generate embedding for a search query
 * (same as single embedding but semantically named)
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
    return generateEmbedding(query);
}
