import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        if (!userId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
