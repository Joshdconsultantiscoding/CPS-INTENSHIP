import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getUserMembershipStatus } from "@/app/actions/community";
import { CommunityOnboarding } from "@/components/community/community-onboarding";
import { getAuthUser } from "@/lib/auth";

export default async function CommunityPage() {
    const user = await getAuthUser();

    // Enforce access control
    const { enforceAccess } = await import("@/lib/middleware/access-guard");
    const access = await enforceAccess(user.id, "/dashboard/community");

    if (!access.allowed) {
        const { BlockedRouteView } = await import("@/components/dashboard/blocked-route-view");
        return (
            <BlockedRouteView
                reason={access.reason || "Access to the community has been restricted by an administrator."}
                route="/dashboard/community"
                routeName="Community"
            />
        );
    }

    // Admins always go to their management hub
    if (user.role === 'admin') {
        redirect("/dashboard/admin/community");
    }

    const res = await getUserMembershipStatus();

    // If already in a niche, redirect to it
    if (res.success && res.membership) {
        redirect(`/dashboard/community/${res.membership.niche_id}`);
    }

    return (
        <div className="container mx-auto py-12 px-4 min-h-[80vh] flex flex-col items-center justify-center">
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-3">
                    <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-2xl">
                        <Users className="h-8 w-8" />
                    </span>
                    Join the Community
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Complete your profile to unlock access to specialized sub-communities,
                    resource sharing, and collaborative projects.
                </p>
            </div>

            <CommunityOnboarding />
        </div>
    );
}
