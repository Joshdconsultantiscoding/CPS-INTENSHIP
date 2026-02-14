import { ModelMessage, generateText, streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider'; // Assuming this is installed or standard
import { AIProvider, AIResponse } from './base';

export class OllamaProvider extends AIProvider {
    readonly name = 'ollama';
    readonly isLocal = true;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        const ollama = createOllama({
            baseURL: this.config.baseUrl || 'http://localhost:11434/api',
        });

        const model = ollama(this.config.modelName || 'llama3');

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
        const ollama = createOllama({
            baseURL: this.config.baseUrl || 'http://localhost:11434/api',
        });

        const model = ollama(this.config.modelName || 'llama3');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
