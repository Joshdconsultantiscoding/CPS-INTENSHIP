import { ModelMessage, generateText, streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { AIProvider, AIResponse } from './base';

export class AnthropicProvider extends AIProvider {
    readonly name = 'anthropic';
    readonly isLocal = false;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        const client = createAnthropic({
            apiKey: this.config.apiKey,
        });

        const model = client(this.config.modelName || 'claude-3-5-sonnet-20240620');

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
        const client = createAnthropic({
            apiKey: this.config.apiKey,
        });

        const model = client(this.config.modelName || 'claude-3-5-sonnet-20240620');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
