import { getAuthUser } from "@/lib/auth";
import { ReferralService } from "@/lib/services/referral-service";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ReferralDashboard } from "@/components/referrals/referral-dashboard";

export const metadata = {
    title: "Referrals",
};

export default async function ReferralsPage() {
    const user = await getAuthUser();
    const adminSupabase = await createAdminClient();
    const supabase = await createClient();
    const isAdmin = user.role === "admin";

    // Parallel data fetching
    const [
        platformSettings,
        referralCode,
        stats,
        balance,
        referralHistory,
        pointsHistory,
        leaderboard,
        rewardsRes,
        redemptionsRes,
        referrersList,
    ] = await Promise.all([
        ReferralService.getPlatformSettings(),
        ReferralService.getOrCreateReferralCode(user.id),
        ReferralService.getReferralStats(user.id, isAdmin),
        ReferralService.getPointsBalance(user.id),
        ReferralService.getReferralHistory(user.id, isAdmin),
        ReferralService.getPointsHistory(user.id),
        ReferralService.getLeaderboard(10),
        supabase
            .from("reward_items")
            .select("*")
            .eq("is_active", true)
            .is("archived_at", null)
            .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
            .order("points_required", { ascending: true }),
        supabase
            .from("redemptions")
            .select("*, reward:reward_items(*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        isAdmin ? ReferralService.getReferrersList() : Promise.resolve([]),
    ]);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cpsintern.com";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
                <p className="text-muted-foreground">
                    {isAdmin
                        ? "Monitor the referral program and manage rewards"
                        : "Invite friends, earn points, and unlock rewards"}
                </p>
            </div>

            <ReferralDashboard
                userId={user.id}
                isAdmin={isAdmin}
                platformSettings={platformSettings}
                referralCode={referralCode}
                referralLink={`${baseUrl}/auth/sign-up?ref=${referralCode}`}
                stats={stats}
                pointsBalance={balance}
                referralHistory={referralHistory || []}
                pointsHistory={pointsHistory}
                leaderboard={leaderboard}
                rewards={rewardsRes.data || []}
                redemptions={redemptionsRes.data || []}
                referrersList={referrersList}
            />
        </div>
    );
}
