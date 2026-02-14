import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { encrypt, maskApiKey } from '@/lib/ai/encryption';

/**
 * GET /api/ai/providers - List all providers
 * POST /api/ai/providers - Update a provider (key, status, priority)
 */

export async function GET() {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createAdminClient();
        const { data: providers, error } = await supabase
            .from('ai_providers')
            .select('*')
            .order('priority', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Mask API keys for safety
        const maskedProviders = providers.map(p => ({
            ...p,
            api_key_encrypted: undefined,
            has_api_key: !!p.api_key_encrypted,
            // We don't mask here, just hide. Settings route handles specific masked view if needed.
        }));

        return NextResponse.json(maskedProviders);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { id, is_enabled, priority, api_key, base_url } = body;

        if (!id) return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });

        const supabase = await createAdminClient();
        const updates: any = {
            updated_at: new Date().toISOString()
        };

        if (is_enabled !== undefined) updates.is_enabled = is_enabled;
        if (priority !== undefined) updates.priority = priority;
        if (base_url !== undefined) updates.base_url = base_url;

        if (api_key && api_key.trim()) {
            updates.api_key_encrypted = encrypt(api_key.trim());
        }

        const { data, error } = await supabase
            .from('ai_providers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, provider: data.name });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
