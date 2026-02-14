// Documents List/Delete API
// GET: list all knowledge documents, DELETE: remove a document

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const scope = searchParams.get('scope'); // 'global' | 'intern'
        const internId = searchParams.get('intern_id');

        const supabase = await createAdminClient();
        let query = supabase
            .from('ai_knowledge_documents')
            .select('*')
            .order('created_at', { ascending: false });

        if (scope) query = query.eq('doc_scope', scope);
        if (internId) query = query.eq('intern_id', internId);

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ documents: data || [] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const docId = searchParams.get('id');

        if (!docId) {
            return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Chunks are cascade-deleted via FK
        const { error } = await supabase
            .from('ai_knowledge_documents')
            .delete()
            .eq('id', docId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
