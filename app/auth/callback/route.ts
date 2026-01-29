import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  try {
    const supabase = await createClient();

    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth callback error:", error);
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
    }

    if (session?.user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (!existingProfile) {
        // Create profile for new OAuth user - use their provider info
        const fullName = session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.user_metadata?.user_name ||
          session.user.email?.split("@")[0] ||
          "User";

        await supabase.from("profiles").insert({
          id: session.user.id,
          email: session.user.email,
          full_name: fullName,
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          role: "intern", // Default role for OAuth users
          auth_provider: session.user.app_metadata?.provider || "oauth",
          online_status: "online",
          last_seen_at: new Date().toISOString(),
        });
      } else {
        // Update existing profile - just set online status
        await supabase.from("profiles").update({
          online_status: "online",
          last_seen_at: new Date().toISOString(),
        }).eq("id", session.user.id);
      }
    }

    // Redirect to dashboard after successful auth
    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (error: any) {
    console.error("OAuth callback exception:", error);
    return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
  }
}
