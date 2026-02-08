import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  // Fetch profile to get username
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  if (profile?.username) {
    redirect(`/profile/${profile.username}`);
  }

  // Fallback if no username found (should generally not happen if migration ran)
  // or if user doesn't exist
  redirect("/dashboard");
}

