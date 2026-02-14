// Warning & Enforcement Engine
// Checks submissions against knowledge base, issues structured warnings

import { searchGlobalKnowledge, type SearchResult } from './vector-search';
import { generateAIResponse } from './model-adapter';
import { getAISettings } from './model-adapter';
import { createAdminClient } from '@/lib/supabase/server';

export interface ViolationCheck {
    isViolation: boolean;
    violationType: string;
    severity: 'minor' | 'moderate' | 'severe' | 'critical';
    description: string;
    violatedClause: string | null;
    sourceChunk: SearchResult | null;
    recommendedAction: string;
    pointsToDeduct: number;
}

export interface WarningRecord {
    id: string;
    internId: string;
    warningNumber: number;
    severity: string;
    violationType: string;
    description: string;
    violatedClause: string | null;
    actionTaken: string;
    pointsDeducted: number;
    requiresMeeting: boolean;
    escalated: boolean;
}

/**
 * Check an intern's submission/behavior against the knowledge base
 */
export async function checkForViolations(
    description: string,
    internId: string,
    context?: string,
): Promise<ViolationCheck> {
    // Search knowledge base for relevant rules/policies
    const relevantChunks = await searchGlobalKnowledge(
        `rules violations penalties ${description}`,
        5,
    );

    if (relevantChunks.length === 0) {
        return {
            isViolation: false,
            violationType: 'none',
            severity: 'minor',
            description: 'No relevant policy found',
            violatedClause: null,
            sourceChunk: null,
            recommendedAction: 'none',
            pointsToDeduct: 0,
        };
    }

    // Build context from knowledge base
    const knowledgeContext = relevantChunks
        .map(c => `[${c.doc_type}] ${c.content}`)
        .join('\n\n');

    // Use AI to analyze the violation
    const prompt = `You are a strict policy enforcement analyzer. Analyze the following situation against the institutional policies.

INSTITUTIONAL POLICIES:
${knowledgeContext}

SITUATION TO ANALYZE:
${description}
${context ? `\nADDITIONAL CONTEXT: ${context}` : ''}

Respond with a JSON object (no markdown, just raw JSON):
{
  "isViolation": true/false,
  "violationType": "string describing the type (e.g., 'late_submission', 'missed_report', 'quality_issue', 'plagiarism')",
  "severity": "minor|moderate|severe|critical",
  "description": "specific description of the violation",
  "violatedClause": "quote the specific clause/rule from the policies above that was violated, or null",
  "recommendedAction": "what action should be taken",
  "pointsToDeduct": number
}`;

    try {
        const result = await generateAIResponse(
            [{ role: 'user', content: prompt }],
            'You are a policy enforcement analyzer. Respond ONLY with valid JSON.',
            'high'
        );

        const parsed = JSON.parse(result.text.trim());
        return {
            ...parsed,
            sourceChunk: relevantChunks[0] || null,
        };
    } catch (e) {
        console.error('[Enforcement] Analysis failed:', e);
        return {
            isViolation: false,
            violationType: 'analysis_error',
            severity: 'minor',
            description: 'Could not analyze the situation',
            violatedClause: null,
            sourceChunk: null,
            recommendedAction: 'Manual review required',
            pointsToDeduct: 0,
        };
    }
}

/**
 * Issue a warning to an intern with full audit trail
 */
export async function issueWarning(
    internId: string,
    violation: ViolationCheck,
    issuedBy?: string,
    isAutonomous: boolean = false,
): Promise<WarningRecord | null> {
    const supabase = await createAdminClient();

    // Get current warning count for progressive discipline
    const { count } = await supabase
        .from('ai_warnings')
        .select('*', { count: 'exact', head: true })
        .eq('intern_id', internId)
        .eq('status', 'active');

    const warningNumber = (count || 0) + 1;

    // Escalation logic based on warning count
    const requiresMeeting = warningNumber >= 3;
    const escalated = warningNumber > 3;
    const escalationReason = escalated
        ? `Intern has ${warningNumber} active warnings. Automatic escalation per progressive discipline policy.`
        : null;

    // Adjust points based on warning level
    let pointsToDeduct = violation.pointsToDeduct;
    if (warningNumber === 2) pointsToDeduct = Math.max(pointsToDeduct, 100);
    if (warningNumber >= 3) pointsToDeduct = Math.max(pointsToDeduct, 200);

    // Log the AI decision first
    const { data: logEntry } = await supabase
        .from('ai_decision_logs')
        .insert({
            action_type: 'warning_issued',
            input_summary: `Violation check: ${violation.violationType} for intern ${internId}`,
            output_summary: `Warning #${warningNumber} issued: ${violation.description}`,
            full_response: JSON.stringify(violation),
            source_chunk_ids: violation.sourceChunk ? [violation.sourceChunk.id] : [],
            authority_layers_used: ['Layer1:enforcement'],
            intern_id: internId,
            triggered_by: issuedBy || null,
            is_autonomous: isAutonomous,
        })
        .select('id')
        .single();

    // Insert the warning
    const { data: warning, error } = await supabase
        .from('ai_warnings')
        .insert({
            intern_id: internId,
            warning_number: warningNumber,
            severity: violation.severity,
            violation_type: violation.violationType,
            violation_description: violation.description,
            violated_clause: violation.violatedClause,
            source_document_id: violation.sourceChunk?.document_id || null,
            source_chunk_id: violation.sourceChunk?.id || null,
            action_taken: violation.recommendedAction,
            points_deducted: pointsToDeduct,
            requires_meeting: requiresMeeting,
            escalated,
            escalation_reason: escalationReason,
            status: 'active',
            issued_by: issuedBy || null,
            is_autonomous: isAutonomous,
            decision_log_id: logEntry?.id || null,
        })
        .select()
        .single();

    if (error) {
        console.error('[Enforcement] Failed to insert warning:', error);
        return null;
    }

    // Deduct points from intern profile
    if (pointsToDeduct > 0) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('total_points')
            .eq('id', internId)
            .single();

        if (profile) {
            const newTotal = Math.max(0, (profile.total_points || 0) - pointsToDeduct);
            await supabase
                .from('profiles')
                .update({ total_points: newTotal })
                .eq('id', internId);
        }
    }

    return {
        id: warning.id,
        internId,
        warningNumber,
        severity: violation.severity,
        violationType: violation.violationType,
        description: violation.description,
        violatedClause: violation.violatedClause,
        actionTaken: violation.recommendedAction,
        pointsDeducted: pointsToDeduct,
        requiresMeeting,
        escalated,
    };
}

/**
 * Get warning history for an intern
 */
export async function getInternWarnings(internId: string) {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from('ai_warnings')
        .select('*')
        .eq('intern_id', internId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[Enforcement] Failed to fetch warnings:', error);
        return [];
    }

    return data || [];
}
