import { ModelMessage } from 'ai';
import { createAdminClient } from '@/lib/supabase/server';
import { decrypt } from './encryption';
import { AIProvider } from './providers/base';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GoogleProvider } from './providers/gemini';
import { MistralProvider } from './providers/mistral';
import { CohereProvider } from './providers/cohere';
import { GroqProvider } from './providers/groq';
import { PerplexityProvider } from './providers/perplexity';
import { OpenRouterProvider } from './providers/openrouter';
import { OllamaProvider } from './providers/ollama';
import { LocalLLMProvider } from './providers/local-llm';

export type TaskSensitivity = 'low' | 'medium' | 'high';

export interface AIRunOptions {
    taskType?: string;
    sensitivity?: TaskSensitivity;
    modelName?: string;
    systemPrompt?: string;
    stream?: boolean;
}

export class AIEngine {
    private static providers: Map<string, AIProvider> = new Map();
    private static isInitialized = false;
    private static isInitializing = false;

    /**
     * Load all enabled providers from DB and initialize adapters
     */
    static async initialize() {
        if (this.isInitialized || this.isInitializing) return;
        this.isInitializing = true;

        try {
            const supabase = await createAdminClient();
            const { data: providers, error } = await supabase
                .from('ai_providers')
                .select('*')
                .eq('is_enabled', true)
                .order('priority', { ascending: true });

            if (error) throw new Error(`Failed to load AI providers: ${error.message}`);

            for (const p of providers) {
                const config = {
                    apiKey: p.api_key_encrypted ? decrypt(p.api_key_encrypted) : undefined,
                    baseUrl: p.base_url,
                    modelName: p.model_name,
                    customInstructions: p.custom_instructions,
                    settings: p.supported_features
                };

                let provider: AIProvider | null = null;

                switch (p.name) {
                    case 'openai': provider = new OpenAIProvider(config); break;
                    case 'anthropic': provider = new AnthropicProvider(config); break;
                    case 'google': provider = new GoogleProvider(config); break;
                    case 'mistral': provider = new MistralProvider(config); break;
                    case 'cohere': provider = new CohereProvider(config); break;
                    case 'groq': provider = new GroqProvider(config); break;
                    case 'perplexity': provider = new PerplexityProvider(config); break;
                    case 'openrouter': provider = new OpenRouterProvider(config); break;
                    case 'ollama': provider = new OllamaProvider(config); break;
                    case 'local-llm': provider = new LocalLLMProvider(config); break;
                }

                if (provider) {
                    this.providers.set(p.name, provider);
                }
            }
            this.isInitialized = true;
        } catch (error) {
            console.error("AIEngine initialization failed:", error);
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Get the best provider based on sensitivity and settings
     */
    static async getBestProvider(sensitivity: TaskSensitivity = 'medium'): Promise<AIProvider> {
        if (this.providers.size === 0) await this.initialize();

        const supabase = await createAdminClient();
        const { data: settings } = await supabase.from('ai_settings').select('privacy_mode_enabled, default_provider_id').single();

        // 1. If Privacy Mode is ON and sensitivity is HIGH, force local
        if (settings?.privacy_mode_enabled || sensitivity === 'high') {
            const local = Array.from(this.providers.values()).find(p => p.isLocal);
            if (local) return local;
        }

        // 2. Try the primary provider from settings
        if (settings?.default_provider_id) {
            const { data: defProvider } = await supabase.from('ai_providers').select('name').eq('id', settings.default_provider_id).single();
            if (defProvider && this.providers.has(defProvider.name)) {
                return this.providers.get(defProvider.name)!;
            }
        }

        // 3. Fallback to highest priority enabled provider
        const first = Array.from(this.providers.values())[0];
        if (!first) throw new Error('No AI providers available');

        return first;
    }

    /**
     * Main execution entry point with automatic fallback
     */
    static async run(
        messages: ModelMessage[],
        options: AIRunOptions = {}
    ) {
        const sensitivity = options.sensitivity || 'medium';
        let provider = await this.getBestProvider(sensitivity);

        try {
            console.log(`[AIEngine] Routing task ${options.taskType || 'unknown'} to ${provider.name} (Sensitivity: ${sensitivity})`);
            const combinedPrompt = [provider.getCustomInstructions(), options.systemPrompt].filter(Boolean).join('\n\n');
            return await provider.generateText(messages, combinedPrompt || undefined);
        } catch (error) {
            console.warn(`[AIEngine] Primary provider ${provider.name} failed. Attempting fallback...`, error);

            // Fallback logic: Try the next available non-local provider if sensitive isn't high
            const fallback = Array.from(this.providers.values()).find(p => p.name !== provider.name && (sensitivity === 'high' ? p.isLocal : true));

            if (!fallback) throw error;

            console.log(`[AIEngine] Falling back to ${fallback.name}`);
            const combinedFallbackPrompt = [fallback.getCustomInstructions(), options.systemPrompt].filter(Boolean).join('\n\n');
            return await fallback.generateText(messages, combinedFallbackPrompt || undefined);
        }
    }

    /**
     * Streaming execution
     */
    static async stream(
        messages: ModelMessage[],
        options: AIRunOptions = {}
    ) {
        const sensitivity = options.sensitivity || 'medium';
        const provider = await this.getBestProvider(sensitivity);

        console.log(`[AIEngine] Streaming task ${options.taskType || 'unknown'} via ${provider.name}`);
        const combinedPrompt = [provider.getCustomInstructions(), options.systemPrompt].filter(Boolean).join('\n\n');
        return await provider.streamText(messages, combinedPrompt || undefined);
    }
}
