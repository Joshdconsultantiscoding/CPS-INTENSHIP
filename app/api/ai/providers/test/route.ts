import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { AIEngine } from '@/lib/ai/engine';

/**
 * POST /api/ai/providers/test
 * Test a specific provider with a simple prompt
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { providerName } = await request.json();
        if (!providerName) return NextResponse.json({ error: 'providerName required' }, { status: 400 });

        // Force initialize to ensure providers are loaded
        await AIEngine.initialize();

        // Use the specific provider directly for the test
        // @ts-ignore - accessing private or internal map if we expose it or just use a helper
        const provider = (AIEngine as any).providers.get(providerName);

        if (!provider) {
            return NextResponse.json({ error: `Provider ${providerName} not found or not initialized` }, { status: 404 });
        }

        const result = await provider.generateText(
            [{ role: 'user', content: 'Connection test. Respond with exactly the word SUCCESS.' }],
            'You are a connection tester.'
        );

        return NextResponse.json({
            success: result.text.toUpperCase().includes('SUCCESS'),
            response: result.text,
            usage: result.usage
        });
    } catch (e: any) {
        console.error('[AI:Test] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
