// 3-Layer RAG Reasoning Engine
// Orchestrates knowledge retrieval and AI response generation

import { retrieveKnowledge, type SearchResult } from './vector-search';
import { generateAIResponse } from './model-adapter';
import { getAISettings } from './model-adapter';
import { createAdminClient } from '@/lib/supabase/server';
import type { ModelMessage } from 'ai';

export interface ReasoningContext {
    globalKnowledge: SearchResult[];
    internKnowledge: SearchResult[];
    personalityRules: string;
    systemInstructions: string;
}

export interface ReasoningResult {
    response: string;
    context: ReasoningContext;
    sourceChunkIds: string[];
    authorityLayersUsed: string[];
    tokenCount: number;
}

/**
 * Build the 3-layer reasoning context
 */
async function buildReasoningContext(
    query: string,
    internId?: string,
): Promise<ReasoningContext> {
    const settings = await getAISettings();

    // Retrieve knowledge from vector DB
    const allResults = await retrieveKnowledge(query, internId);

    // Separate by layer
    const globalKnowledge = allResults.filter(r => r.doc_scope === 'global');
    const internKnowledge = allResults.filter(r => r.doc_scope === 'intern');

    // Layer 3: Admin personality from settings
    const personalityConfig = settings?.personality_config;
    const personalityRules = personalityConfig
        ? `Tone: ${personalityConfig.tone}. Authority style: ${personalityConfig.authority_style}. ` +
        `Discipline framework: ${personalityConfig.discipline_framework}. ` +
        (personalityConfig.custom_rules?.length
            ? `Custom rules: ${personalityConfig.custom_rules.join('; ')}`
            : '')
        : '';

    return {
        globalKnowledge,
        internKnowledge,
        personalityRules,
        systemInstructions: settings?.system_instructions || '',
    };
}

/**
 * Compose the structured system prompt from 3 layers
 */
function composeSystemPrompt(context: ReasoningContext): string {
    const parts: string[] = [];

    // Base instructions
    parts.push(context.systemInstructions);

    // Layer 1: Global Master Knowledge
    if (context.globalKnowledge.length > 0) {
        parts.push('\n\n=== INSTITUTIONAL KNOWLEDGE (HIGHEST AUTHORITY) ===');
        parts.push('The following is from official institutional documents. These override all other reasoning.');
        for (const chunk of context.globalKnowledge) {
            parts.push(`\n[${chunk.doc_type.toUpperCase()} | Authority: ${chunk.authority_level}]`);
            parts.push(chunk.content);
        }
    }

    // Layer 2: Intern-specific Knowledge
    if (context.internKnowledge.length > 0) {
        parts.push('\n\n=== INTERN PROFILE KNOWLEDGE ===');
        parts.push('The following is specific to this intern\'s learning plan and expectations.');
        for (const chunk of context.internKnowledge) {
            parts.push(`\n[${chunk.doc_type.toUpperCase()} | Intern-specific]`);
            parts.push(chunk.content);
        }
    }

    // Layer 3: Personality rules
    if (context.personalityRules) {
        parts.push('\n\n=== ADMIN PERSONALITY DIRECTIVES ===');
        parts.push(context.personalityRules);
    }

    // Enforcement rules
    parts.push('\n\n=== CRITICAL OPERATING RULES ===');
    parts.push('1. NEVER hallucinate policies or rules not found in the knowledge base above.');
    parts.push('2. If asked about something not covered in the knowledge base, say so explicitly.');
    parts.push('3. When enforcing rules, ALWAYS cite the source document type.');
    parts.push('4. If your response would contradict the Internship Agreement, self-correct immediately.');
    parts.push('5. Prioritize knowledge by authority: Internship Plan > Agreement > Q&A > Intern Profile.');

    return parts.join('\n');
}

/**
 * Execute RAG-based reasoning with full audit trail
 */
export async function executeReasoning(
    userMessage: string,
    options: {
        internId?: string;
        conversationHistory?: ModelMessage[];
        actionType?: string;
        triggeredBy?: string;
    } = {},
): Promise<ReasoningResult> {
    // 1. Build 3-layer context
    const context = await buildReasoningContext(userMessage, options.internId);

    // 2. Compose system prompt from all layers
    const systemPrompt = composeSystemPrompt(context);

    // 3. Build messages array
    const messages: ModelMessage[] = [
        ...(options.conversationHistory || []),
        { role: 'user', content: userMessage },
    ];

    // 4. Generate AI response
    const result = await generateAIResponse(messages, systemPrompt, 'medium');

    // 5. Collect source references
    const allChunks = [...context.globalKnowledge, ...context.internKnowledge];
    const sourceChunkIds = allChunks.map(c => c.id);
    const authorityLayersUsed = [...new Set(allChunks.map(c => {
        if (c.doc_scope === 'global') return `Layer1:${c.doc_type}`;
        return `Layer2:${c.doc_type}`;
    }))];
    if (context.personalityRules) authorityLayersUsed.push('Layer3:personality');

    // 6. Log decision to database
    try {
        const supabase = await createAdminClient();
        await supabase.from('ai_decision_logs').insert({
            action_type: options.actionType || 'chat_response',
            input_summary: userMessage.slice(0, 500),
            output_summary: result.text.slice(0, 500),
            full_response: result.text,
            source_chunk_ids: sourceChunkIds,
            authority_layers_used: authorityLayersUsed,
            reasoning_context: systemPrompt.slice(0, 10000),
            intern_id: options.internId || null,
            triggered_by: options.triggeredBy || null,
            is_autonomous: !options.triggeredBy,
            model_used: 'gpt-4o-mini',
            token_count: result.usage?.totalTokens || 0,
        });
    } catch (logError) {
        console.error('[ReasoningEngine] Failed to log decision:', logError);
    }

    return {
        response: result.text,
        context,
        sourceChunkIds,
        authorityLayersUsed,
        tokenCount: result.usage?.totalTokens || 0,
    };
}
