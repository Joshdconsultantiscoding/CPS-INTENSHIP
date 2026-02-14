// Document/Submission Analyzer API – POST
// Analyzes intern submissions against the knowledge base

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { checkForViolations, issueWarning } from '@/lib/ai/enforcement';
import { executeReasoning } from '@/lib/ai/reasoning-engine';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { action, internId, description, context, autoWarn } = body;

        if (!action || !description) {
            return NextResponse.json(
                { error: 'action and description are required' },
                { status: 400 },
            );
        }

        switch (action) {
            case 'check_violation': {
                if (!internId) {
                    return NextResponse.json(
                        { error: 'internId is required for violation checks' },
                        { status: 400 },
                    );
                }

                const violation = await checkForViolations(description, internId, context);

                // Auto-issue warning if violation detected and autoWarn is enabled
                let warning = null;
                if (violation.isViolation && autoWarn) {
                    warning = await issueWarning(internId, violation, user.id, false);
                }

                return NextResponse.json({
                    violation,
                    warning,
                });
            }

            case 'analyze_submission': {
                if (!internId) {
                    return NextResponse.json(
                        { error: 'internId is required for submission analysis' },
                        { status: 400 },
                    );
                }

                const result = await executeReasoning(
                    `Analyze this intern submission and provide a detailed assessment:\n\n${description}\n\n${context ? `Additional context: ${context}` : ''}`,
                    {
                        internId,
                        actionType: 'submission_review',
                        triggeredBy: user.id,
                    },
                );

                return NextResponse.json({
                    analysis: result.response,
                    sources: {
                        chunkIds: result.sourceChunkIds,
                        authorityLayers: result.authorityLayersUsed,
                    },
                });
            }

            case 'analyze_document': {
                const result = await executeReasoning(
                    `Analyze this document and provide a comprehensive summary with key findings:\n\n${description}`,
                    {
                        internId: internId || undefined,
                        actionType: 'document_analysis',
                        triggeredBy: user.id,
                    },
                );

                return NextResponse.json({
                    analysis: result.response,
                    sources: {
                        chunkIds: result.sourceChunkIds,
                        authorityLayers: result.authorityLayersUsed,
                    },
                });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 },
                );
        }
    } catch (e: any) {
        console.error('[AI Analyze] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
