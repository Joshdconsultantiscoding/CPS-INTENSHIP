// RAG-powered Chat API – POST
// Retrieves knowledge → builds 3-layer context → streams AI response

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { executeReasoning } from '@/lib/ai/reasoning-engine';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { message, internId, conversationHistory } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 },
            );
        }

        // Execute RAG-based reasoning
        const result = await executeReasoning(message, {
            internId: internId || undefined,
            conversationHistory: conversationHistory || [],
            actionType: 'chat_response',
            triggeredBy: user.id,
        });

        return NextResponse.json({
            response: result.response,
            sources: {
                chunkIds: result.sourceChunkIds,
                authorityLayers: result.authorityLayersUsed,
                globalChunks: result.context.globalKnowledge.length,
                internChunks: result.context.internKnowledge.length,
            },
            tokenCount: result.tokenCount,
        });
    } catch (e: any) {
        console.error('[AI Chat] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
