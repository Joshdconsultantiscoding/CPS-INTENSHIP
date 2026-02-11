import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";
import React from "react";

// ============================================================
// SUPER ADMIN LAYOUT — Joshua only
// This is a NEW route. Does NOT modify any existing routes.
// ============================================================

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    try {
        const { userId } = await auth();
        if (!userId) redirect("/auth/sign-in");

        const user = await currentUser();
        if (!user) redirect("/auth/sign-in");

        const email = user.emailAddresses[0]?.emailAddress?.toLowerCase() || "";

        // STRICT: Super admin access is ONLY for Joshua's email
        if (email !== config.adminEmail.toLowerCase()) {
            redirect("/dashboard");
        }

        return <>{children}</>;
    } catch (error: any) {
        if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
        console.error("[SuperAdminLayout] Error:", error);
        redirect("/dashboard");
    }
}
