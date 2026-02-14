import { type ModelMessage } from 'ai';
import { createAdminClient } from '@/lib/supabase/server';
import { AIEngine, TaskSensitivity } from './engine';

/**
 * Load AI settings from database (Legacy wrapper for compatibility)
 */
export async function getAISettings() {
    const supabase = await createAdminClient();
    const { data } = await supabase
        .from('ai_settings')
        .select('*')
        .limit(1)
        .single();
    return data;
}

/**
 * Create an AI model instance (needed for embeddings and legacy calls)
 */
export async function createModelInstance() {
    const supabase = await createAdminClient();
    const { data: settings } = await supabase
        .from('ai_settings')
        .select('*')
        .single();

    if (!settings) throw new Error('AI settings not configured');

    const { createOpenAI } = await import('@ai-sdk/openai');
    const { decrypt } = await import('./encryption');

    const apiKey = settings.api_key_encrypted
        ? decrypt(settings.api_key_encrypted)
        : null;

    if (!apiKey) throw new Error('AI API key not configured');

    const provider = createOpenAI({
        apiKey,
        compatibility: 'strict',
    });

    return {
        model: provider(settings.model_name || 'gpt-4o-mini'),
        embeddingModel: provider.embedding(settings.embedding_model || 'text-embedding-ada-002'),
        settings,
    };
}

/**
 * Generate a text response using the new AIEngine orchestrator
 */
export async function generateAIResponse(
    messages: ModelMessage[],
    systemPrompt?: string,
    sensitivity: TaskSensitivity = 'medium'
): Promise<{ text: string; usage?: { totalTokens: number } }> {
    const result = await AIEngine.run(messages, {
        systemPrompt,
        sensitivity,
        taskType: 'general_text'
    });

    return {
        text: result.text,
        usage: result.usage
    };
}

/**
 * Stream a text response using the new AIEngine orchestrator
 */
export async function streamAIResponse(
    messages: ModelMessage[],
    systemPrompt?: string,
    sensitivity: TaskSensitivity = 'medium'
) {
    return AIEngine.stream(messages, {
        systemPrompt,
        sensitivity,
        taskType: 'streaming_text'
    });
}
