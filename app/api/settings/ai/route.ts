import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the API settings (only one row should exist)
    const { data: settings, error } = await supabase
      .from("api_settings")
      .select("provider, model, is_active, updated_at")
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error fetching settings:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    // Check if user is admin to show full settings
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    if (settings && isAdmin) {
      return NextResponse.json({
        settings: {
          ...settings,
          api_key: "configured", // Don't expose the actual key
        },
      });
    }

    return NextResponse.json({
      settings: settings ? { is_active: true, provider: settings.provider } : null,
      isConfigured: !!settings,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { provider, api_key, model, is_active } = body;

    if (!provider || !model) {
      return NextResponse.json({ error: "Provider and model are required" }, { status: 400 });
    }

    // Check if settings already exist
    const { data: existing } = await supabase
      .from("api_settings")
      .select("id, api_key_encrypted")
      .single();

    const settingsData: Record<string, unknown> = {
      provider,
      model,
      is_active: is_active ?? true,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // Only update API key if provided
    if (api_key) {
      settingsData.api_key_encrypted = api_key; // In production, encrypt this
    }

    let result;
    if (existing) {
      // Update existing
      result = await supabase
        .from("api_settings")
        .update(settingsData)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      // Insert new
      if (!api_key) {
        return NextResponse.json({ error: "API key is required for initial setup" }, { status: 400 });
      }
      result = await supabase
        .from("api_settings")
        .insert(settingsData)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error saving settings:", result.error);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
