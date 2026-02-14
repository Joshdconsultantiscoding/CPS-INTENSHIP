import { ModelMessage, generateText, streamText } from 'ai';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { AIProvider, AIResponse } from './base';

export class BedrockProvider extends AIProvider {
    readonly name = 'amazon-bedrock';
    readonly isLocal = false;

    async generateText(
        messages: ModelMessage[],
        systemPrompt?: string,
        options?: any
    ): Promise<AIResponse> {
        const client = createAmazonBedrock({
            region: this.config.settings?.region || 'us-east-1',
            accessKeyId: this.config.apiKey?.split(':')[0],
            secretAccessKey: this.config.apiKey?.split(':')[1],
        });

        const model = client(this.config.modelName || 'anthropic.claude-3-sonnet-20240229-v1:0');

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
        const client = createAmazonBedrock({
            region: this.config.settings?.region || 'us-east-1',
            accessKeyId: this.config.apiKey?.split(':')[0],
            secretAccessKey: this.config.apiKey?.split(':')[1],
        });

        const model = client(this.config.modelName || 'anthropic.claude-3-sonnet-20240229-v1:0');

        return streamText({
            model,
            system: systemPrompt,
            messages,
            ...options
        });
    }
}
