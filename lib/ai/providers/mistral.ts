import { ModelMessage, generateText, streamText } from 'ai';
import { createMistral } from '@ai-sdk/mistral';
import { AIProvider, AIResponse } from './base';

export class MistralProvider extends AIProvider {
    readonly name = 'mistral';
    readonly isLocal = false;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        const client = createMistral({
            apiKey: this.config.apiKey,
        });

        const model = client(this.config.modelName || 'mistral-large-latest');

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
        const client = createMistral({
            apiKey: this.config.apiKey,
        });

        const model = client(this.config.modelName || 'mistral-large-latest');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
