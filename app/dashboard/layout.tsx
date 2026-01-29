import React from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { Profile } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Construct profile from Clerk data for the shell
  const profile: Profile = {
    id: userId,
    email: user.emailAddresses[0]?.emailAddress || "",
    full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "User",
    avatar_url: user.imageUrl || null,
    role: "admin", // Defaulting to admin for now based on previous context, or we can fetch from metadata if needed
    created_at: new Date(user.createdAt).toISOString(),
    updated_at: new Date(user.updatedAt).toISOString(),
    last_seen_at: new Date().toISOString(),
    online_status: "online",
  };

  return (
    <DashboardShell userId={userId} profile={profile}>
      {children}
    </DashboardShell>
  );
}
