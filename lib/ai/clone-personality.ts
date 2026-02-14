// Digital Admin Clone – Personality Engine
// Builds document-aware system prompts for the AI clone

import { getAISettings, type AISettings } from './model-adapter';
import { searchGlobalKnowledge, type SearchResult } from './vector-search';

export interface ClonePersonality {
    systemPrompt: string;
    knowledgeSummary: string;
    authorityBoundaries: string[];
}

/**
 * Build the complete clone system prompt from all knowledge layers
 */
export async function buildClonePersonality(
    additionalContext?: string,
): Promise<ClonePersonality> {
    const settings = await getAISettings();

    // Retrieve core institutional knowledge for clone context
    const internshipPlan = await searchGlobalKnowledge('internship plan structure rules', 3);
    const agreement = await searchGlobalKnowledge('internship agreement legal terms', 3);
    const qaDoc = await searchGlobalKnowledge('questions answers guidelines FAQ', 3);

    const personality = settings?.personality_config;

    // Build the authoritative system prompt
    const systemPrompt = buildSystemPrompt(
        settings,
        internshipPlan,
        agreement,
        qaDoc,
        additionalContext,
    );

    const authorityBoundaries = [
        'Must ONLY enforce rules found in the uploaded knowledge base',
        'Must NEVER invent new policies or penalties',
        'Must NEVER override the Internship Agreement',
        'Must NEVER contradict the Internship Plan',
        'Must ALWAYS cite source when making enforcement decisions',
        'Must escalate based on documented policies ONLY',
        'Must refer to admin for decisions outside documented authority',
    ];

    const knowledgeSummary = [
        `Internship Plan chunks: ${internshipPlan.length}`,
        `Agreement chunks: ${agreement.length}`,
        `Q&A chunks: ${qaDoc.length}`,
        `Personality: ${personality?.tone || 'professional'} / ${personality?.authority_style || 'firm_but_fair'}`,
    ].join(' | ');

    return {
        systemPrompt,
        knowledgeSummary,
        authorityBoundaries,
    };
}

function buildSystemPrompt(
    settings: AISettings | null,
    internshipPlan: SearchResult[],
    agreement: SearchResult[],
    qaDoc: SearchResult[],
    additionalContext?: string,
): string {
    const personality = settings?.personality_config;
    const parts: string[] = [];

    // Core identity
    parts.push(`You operate as an institutional authority AI representing the Admin.
You are the digital clone of the Admin – a professional, data-driven operations manager.
Your decisions carry the weight of management authority within the boundaries of documented policies.`);

    // Personality layer
    parts.push(`\n## YOUR PERSONALITY
- Tone: ${personality?.tone || 'professional'}
- Authority Style: ${personality?.authority_style || 'firm_but_fair'}
- Discipline Framework: ${personality?.discipline_framework || 'progressive'}
- You are calm, direct, clear, accountability-focused, fair, and growth-oriented.
- You never accept excuses or negotiate deadlines.
- You never show favoritism or reveal other interns' performance.`);

    if (personality?.custom_rules?.length) {
        parts.push('\n## CUSTOM ADMIN RULES');
        personality.custom_rules.forEach((rule: string, i: number) => {
            parts.push(`${i + 1}. ${rule}`);
        });
    }

    // Admin instructions
    if (settings?.system_instructions) {
        parts.push(`\n## ADMIN BASE INSTRUCTIONS\n${settings.system_instructions}`);
    }

    // Knowledge layers
    if (internshipPlan.length > 0) {
        parts.push('\n## INTERNSHIP PLAN (PRIMARY AUTHORITY)');
        parts.push('This is the highest authority document. All decisions must align with it.');
        internshipPlan.forEach(chunk => parts.push(chunk.content));
    }

    if (agreement.length > 0) {
        parts.push('\n## INTERNSHIP AGREEMENT (LEGAL AUTHORITY)');
        parts.push('This is legally binding. Never contradict or override these terms.');
        agreement.forEach(chunk => parts.push(chunk.content));
    }

    if (qaDoc.length > 0) {
        parts.push('\n## Q&A CLARIFICATIONS (BEHAVIORAL GUIDANCE)');
        parts.push('Use these to clarify ambiguities, but they cannot override the Plan or Agreement.');
        qaDoc.forEach(chunk => parts.push(chunk.content));
    }

    if (additionalContext) {
        parts.push(`\n## ADDITIONAL CONTEXT\n${additionalContext}`);
    }

    // Strict operating rules
    parts.push(`\n## STRICT OPERATING RULES
1. You must NEVER hallucinate rules not found in your knowledge base.
2. You must NEVER invent policies or penalties.
3. You must NEVER override the Internship Agreement.
4. You must NEVER contradict the Internship Plan.
5. You must ALWAYS retrieve knowledge before reasoning.
6. You must ALWAYS cite the source document when enforcing rules.
7. You must ALWAYS log your decision path.
8. When uncertain, you must defer to the Admin for guidance.
9. You enforce rules fairly, consistently, and professionally.
10. You escalate based on documented policies ONLY.`);

    return parts.join('\n');
}

/**
 * Preview what the clone system prompt looks like
 * (Used in the UI for the personality editor)
 */
export async function previewClonePrompt(): Promise<string> {
    const clone = await buildClonePersonality();
    return clone.systemPrompt;
}
