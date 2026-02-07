import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { ReleaseForm } from "@/components/admin/release-form";
import { ShieldCheck } from "lucide-react";
import { config } from "@/lib/config";
import { ChangelogService } from "@/lib/changelog/changelog-service";

export default async function AdminReleasesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/auth/sign-in");

    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase();
    const ADMIN_EMAIL = config.adminEmail.toLowerCase();

    const latestRelease = await ChangelogService.getLatestRelease();
    const currentVersion = latestRelease?.version || "v1.0.0";

    const supabase = await createAdminClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

    const isSystemAdmin = userEmail === ADMIN_EMAIL;
    const isDbAdmin = profile?.role === "admin" || profile?.role === "owner";

    if (!isSystemAdmin && !isDbAdmin) {
        console.warn(`[AdminReleasesPage] Unauthorized access attempt by ${userEmail}. Redirecting to dashboard.`);
        redirect("/dashboard");
    }

    return (
        <div className="container mx-auto max-w-5xl py-10 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Admin Portal</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">Create Release Notes</h1>
                <p className="text-muted-foreground text-lg">
                    Announce new features, bug fixes, and improvements to all CPS Intern users.
                </p>
            </div>

            <ReleaseForm currentVersion={currentVersion} />
        </div>
    );
}
