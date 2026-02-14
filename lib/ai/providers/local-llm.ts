import { ModelMessage, generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { AIProvider, AIResponse } from './base';

/**
 * Generic Local LLM adapter for LM Studio, llama.cpp, etc.
 * Usually follows the OpenAI API format.
 */
export class LocalLLMProvider extends AIProvider {
    readonly name = 'local-llm';
    readonly isLocal = true;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        const client = createOpenAI({
            apiKey: this.config.apiKey || 'not-needed',
            baseURL: this.config.baseUrl || 'http://localhost:1234/v1', // Default LM Studio port
        });

        const model = client(this.config.modelName || 'local-model');

        const result = await generateText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });

        return {
            text: result.text,
            usage: result.usage ? { totalTokens: result.usage.totalTokens } : undefined,
            raw: result
        };
    }

    async streamText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ) {
        const client = createOpenAI({
            apiKey: this.config.apiKey || 'not-needed',
            baseURL: this.config.baseUrl || 'http://localhost:1234/v1',
        });

        const model = client(this.config.modelName || 'local-model');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
