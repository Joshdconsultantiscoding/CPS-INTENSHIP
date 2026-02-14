import { ModelMessage, generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { AIProvider, AIResponse } from './base';

export class OpenRouterProvider extends AIProvider {
    readonly name = 'openrouter';
    readonly isLocal = false;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        const client = createOpenAI({
            apiKey: this.config.apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
        });

        const model = client(this.config.modelName || 'anthropic/claude-3.5-sonnet');

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
            apiKey: this.config.apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
        });

        const model = client(this.config.modelName || 'anthropic/claude-3.5-sonnet');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
