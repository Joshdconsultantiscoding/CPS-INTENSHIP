import { Metadata } from "next";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsPageClient } from "@/components/settings/settings-page-client";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  // Use Clerk auth
  const authUser = await getAuthUser();
  const supabase = await createClient();

  // Build user object for compatibility
  const user = {
    id: authUser.id,
    email: authUser.email,
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = authUser.role === "admin";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and profile settings
        </p>
      </div>
      <SettingsPageClient user={user} profile={profile} isAdmin={isAdmin} />
    </div>
  );
}
