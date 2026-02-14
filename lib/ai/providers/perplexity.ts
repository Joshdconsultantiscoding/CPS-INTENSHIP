import { ModelMessage, generateText, streamText } from 'ai';
import { createPerplexity } from '@ai-sdk/perplexity';
import { AIProvider, AIResponse } from './base';

export class PerplexityProvider extends AIProvider {
    readonly name = 'perplexity';
    readonly isLocal = false;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        const client = createPerplexity({
            apiKey: this.config.apiKey,
        });

        const model = client(this.config.modelName || 'llama-3-sonar-large-32k-online');

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
        const client = createPerplexity({
            apiKey: this.config.apiKey,
        });

        const model = client(this.config.modelName || 'llama-3-sonar-large-32k-online');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
