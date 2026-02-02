import { AblyClientProvider } from "@/providers/ably-provider";
import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  const supabase = await createAdminClient();

  // Parallel Fetch: Profile + Settings to reduce load time
  const [profileRes, settingsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("api_settings").select("setting_value").eq("setting_key", "portal_settings").maybeSingle()
  ]);

  const profile = profileRes.data;
  const settings = settingsRes.data?.setting_value || undefined;

  return (
    <AblyClientProvider userId={user.id}>
      <DashboardShell serverProfile={profile} serverSettings={settings}>
        {children}
      </DashboardShell>
    </AblyClientProvider>
  );
}
