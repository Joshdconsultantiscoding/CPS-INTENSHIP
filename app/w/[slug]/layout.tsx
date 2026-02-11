import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceBySlug } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase/server";
import React from "react";

// ============================================================
// WORKSPACE LAYOUT — Multi-Tenant SaaS Extension
// This is a NEW route group. It does NOT modify /dashboard.
// ============================================================

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    try {
        const { userId } = await auth();
        if (!userId) redirect("/auth/sign-in");

        const { slug } = await params;

        // 1. Validate workspace exists
        const workspace = await getWorkspaceBySlug(slug);
        if (!workspace) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-950">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-3">
                            Workspace Not Found
                        </h1>
                        <p className="text-gray-400 mb-6">
                            The workspace &quot;{slug}&quot; does not exist or has been disabled.
                        </p>
                        <a
                            href="/dashboard"
                            className="inline-flex px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
                        >
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            );
        }

        // 2. Validate user is a member of this workspace
        const supabase = await createAdminClient();
        const { data: membership } = await supabase
            .from("workspace_members")
            .select("*")
            .eq("workspace_id", workspace.id)
            .eq("user_id", userId)
            .single();

        if (!membership) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-950">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-3">
                            Access Denied
                        </h1>
                        <p className="text-gray-400 mb-6">
                            You are not a member of this workspace.
                        </p>
                        <a
                            href="/dashboard"
                            className="inline-flex px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
                        >
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            );
        }

        // 3. Render children with workspace context available through data attributes
        return (
            <div
                data-workspace-id={workspace.id}
                data-workspace-slug={workspace.slug}
                data-workspace-name={workspace.name}
                data-member-role={membership.role}
                className="min-h-screen"
            >
                {children}
            </div>
        );
    } catch (error: any) {
        // If it's a redirect, let it through
        if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;

        console.error("[WorkspaceLayout] Error:", error);
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-3">
                        Something went wrong
                    </h1>
                    <p className="text-gray-400 mb-6">
                        We couldn&apos;t load this workspace. Please try again.
                    </p>
                    <a
                        href="/dashboard"
                        className="inline-flex px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
                    >
                        Go to Dashboard
                    </a>
                </div>
            </div>
        );
    }
}
