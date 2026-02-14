import { ModelMessage, generateText, streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AIProvider, AIResponse } from './base';

export class GoogleProvider extends AIProvider {
    readonly name = 'google';
    readonly isLocal = false;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        const client = createGoogleGenerativeAI({
            apiKey: this.config.apiKey,
        });

        const model = client(this.config.modelName || 'gemini-1.5-pro');

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
        const client = createGoogleGenerativeAI({
            apiKey: this.config.apiKey,
        });

        const model = client(this.config.modelName || 'gemini-1.5-pro');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
