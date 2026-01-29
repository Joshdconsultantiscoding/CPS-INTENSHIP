import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
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

    // Fetch API settings
    const { data: settings, error } = await supabase
      .from("api_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error || !settings) {
      return NextResponse.json({ error: "No API settings configured" }, { status: 400 });
    }

    const { provider, api_key_encrypted: apiKey, model } = settings;

    // Test the API connection based on provider
    let testResponse;
    try {
      switch (provider) {
        case "groq":
          testResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: "Say 'API connection successful' in 5 words or less." }],
              max_tokens: 20,
            }),
          });
          break;

        case "openai":
          testResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: "Say 'API connection successful' in 5 words or less." }],
              max_tokens: 20,
            }),
          });
          break;

        case "together":
          testResponse = await fetch("https://api.together.xyz/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: "Say 'API connection successful' in 5 words or less." }],
              max_tokens: 20,
            }),
          });
          break;

        case "openrouter":
          testResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": "https://internhub.app",
              "X-Title": "InternHub",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: "Say 'API connection successful' in 5 words or less." }],
              max_tokens: 20,
            }),
          });
          break;

        default:
          return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
      }

      if (!testResponse.ok) {
        const errorData = await testResponse.json();
        return NextResponse.json(
          { error: errorData.error?.message || "API request failed" },
          { status: testResponse.status }
        );
      }

      return NextResponse.json({ success: true, message: "API connection successful" });
    } catch (fetchError) {
      console.error("API test error:", fetchError);
      return NextResponse.json({ error: "Failed to connect to API" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
