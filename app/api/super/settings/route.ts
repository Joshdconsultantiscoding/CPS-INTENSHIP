import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("platform_settings")
            .select("*")
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createAdminClient();
        const settings = await req.json();

        // Extract fields to update
        const {
            maintenance_mode,
            portal_selection,
            new_registrations,
            ai_content_generation,
            marketing_banner_active,
            marketing_banner_text,
            system_announcement,
            updated_by
        } = settings;

        // Fetch the single row ID
        const { data: existing } = await supabase
            .from("platform_settings")
            .select("id")
            .single();

        const { data, error } = await supabase
            .from("platform_settings")
            .update({
                maintenance_mode,
                portal_selection,
                new_registrations,
                ai_content_generation,
                marketing_banner_active,
                marketing_banner_text,
                system_announcement,
                updated_by,
                updated_at: new Date().toISOString()
            })
            .eq("id", existing?.id)
            .select()
            .single();

        if (error) throw error;

        // Log the action
        await supabase.from("system_logs").insert({
            action: "update_platform_settings",
            actor: updated_by || "System Admin",
            target_type: "platform_settings",
            target_id: data.id,
            metadata: settings
        });

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
