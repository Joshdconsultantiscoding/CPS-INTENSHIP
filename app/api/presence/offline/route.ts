import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint receives sendBeacon requests for offline status updates
// Critical: sendBeacon sends data as a blob, not JSON
export async function POST(request: NextRequest) {
    try {
        const text = await request.text();
        const data = JSON.parse(text);

        const { userId, online_status, last_seen_at } = data;

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        // Use service role client to bypass RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        const { error } = await supabase
            .from('profiles')
            .update({
                online_status: online_status || 'offline',
                last_seen_at: last_seen_at || new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('[Offline API] Update failed:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Offline API] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
