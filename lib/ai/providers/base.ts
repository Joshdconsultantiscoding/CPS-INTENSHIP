import { ModelMessage } from 'ai';

export interface AIProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    modelName?: string;
    customInstructions?: string;
    settings?: any;
}

export interface AIResponse {
    text: string;
    usage?: {
        totalTokens?: number;
    };
    raw?: any;
}

export abstract class AIProvider {
    abstract readonly name: string;
    abstract readonly isLocal: boolean;

    protected config: AIProviderConfig;

    constructor(config: AIProviderConfig) {
        this.config = config;
    }

    getCustomInstructions(): string | undefined {
        return this.config.customInstructions;
    }

    abstract generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse>;

    abstract streamText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<any>; // Stream result Type varies by SDK, usually handled by Vercel AI SDK or direct ReadableStream

    /**
     * Check if the provider is healthy / keys are valid
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.generateText([{ role: 'user', content: 'test' }], 'respond with ok');
            return true;
        } catch (e) {
            console.error(`[AIProvider:${this.name}] Health check failed:`, e);
            return false;
        }
    }
}
