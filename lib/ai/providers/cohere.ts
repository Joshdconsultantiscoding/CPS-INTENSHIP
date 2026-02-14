import { ModelMessage, generateText, streamText } from 'ai';
import { createCohere } from '@ai-sdk/cohere';
import { AIProvider, AIResponse } from './base';

export class CohereProvider extends AIProvider {
    readonly name = 'cohere';
    readonly isLocal = false;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        const client = createCohere({
            apiKey: this.config.apiKey,
        });

        const model = client(this.config.modelName || 'command-r-plus');

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
        const client = createCohere({
            apiKey: this.config.apiKey,
        });

        const model = client(this.config.modelName || 'command-r-plus');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
