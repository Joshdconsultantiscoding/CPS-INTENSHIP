// AI Settings API – GET / POST
// Admin-only: manage API keys, system instructions, autonomous mode

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { encrypt, decrypt, maskApiKey } from '@/lib/ai/encryption';

export async function GET() {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from('ai_settings')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Mask the API key for the frontend
        const response = {
            ...data,
            api_key_encrypted: undefined,
            api_key_masked: data.api_key_encrypted
                ? maskApiKey(decrypt(data.api_key_encrypted))
                : null,
            has_api_key: !!data.api_key_encrypted,
        };

        return NextResponse.json(response);
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
        const supabase = await createAdminClient();

        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
            updated_by: user.id,
        };

        // Encrypt API key if provided
        if (body.api_key && body.api_key.trim()) {
            updates.api_key_encrypted = encrypt(body.api_key.trim());
        }

        if (body.ai_provider !== undefined) updates.ai_provider = body.ai_provider;
        if (body.model_name !== undefined) updates.model_name = body.model_name;
        if (body.embedding_model !== undefined) updates.embedding_model = body.embedding_model;
        if (body.system_instructions !== undefined) updates.system_instructions = body.system_instructions;
        if (body.personality_config !== undefined) updates.personality_config = body.personality_config;
        if (body.autonomous_mode !== undefined) updates.autonomous_mode = body.autonomous_mode;
        if (body.autonomous_config !== undefined) updates.autonomous_config = body.autonomous_config;
        if (body.max_file_size_mb !== undefined) updates.max_file_size_mb = body.max_file_size_mb;
        if (body.privacy_mode_enabled !== undefined) updates.privacy_mode_enabled = body.privacy_mode_enabled;
        if (body.default_provider_id !== undefined) updates.default_provider_id = body.default_provider_id;

        const { data, error } = await supabase
            .from('ai_settings')
            .update(updates)
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Log the settings change
        await supabase.from('ai_decision_logs').insert({
            action_type: 'chat_response',
            input_summary: 'AI settings updated by admin',
            output_summary: `Updated fields: ${Object.keys(updates).filter(k => k !== 'updated_at' && k !== 'updated_by').join(', ')}`,
            triggered_by: user.id,
            is_autonomous: false,
        });

        return NextResponse.json({
            success: true,
            has_api_key: !!data.api_key_encrypted,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
