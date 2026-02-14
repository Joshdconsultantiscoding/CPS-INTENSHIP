import { ModelMessage, generateText, streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai'; // Groq is OpenAI compatible or has own provider
import { AIProvider, AIResponse } from './base';

export class GroqProvider extends AIProvider {
    readonly name = 'groq';
    readonly isLocal = false;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        // Groq can be used via OpenAI provider with its base URL
        const client = createOpenAI({
            apiKey: this.config.apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
        });

        const model = client(this.config.modelName || 'llama3-8b-8192');

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
            baseURL: 'https://api.groq.com/openai/v1',
        });

        const model = client(this.config.modelName || 'llama3-8b-8192');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
