import { ModelMessage, generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { AIProvider, AIResponse } from './base';

export class OpenAIProvider extends AIProvider {
    readonly name = 'openai';
    readonly isLocal = false;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        const client = createOpenAI({
            apiKey: this.config.apiKey,
            compatibility: 'strict',
        });

        const model = client(this.config.modelName || 'gpt-4o-mini');

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
            compatibility: 'strict',
        });

        const model = client(this.config.modelName || 'gpt-4o-mini');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
