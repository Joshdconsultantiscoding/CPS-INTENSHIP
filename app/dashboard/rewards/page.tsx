import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RewardsOverview } from "@/components/rewards/rewards-overview";

export const metadata = {
  title: "Rewards",
};

export default async function RewardsPage() {
  // Use Clerk auth
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = user.role === "admin";

  // Get all rewards (active, non-archived, non-expired)
  const { data: rewards } = await supabase
    .from("reward_items")
    .select("*")
    .eq("is_active", true)
    .is("archived_at", null)
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("points_required", { ascending: true });

  // Get claimed rewards (using new reward_claims table)
  const { data: claims } = await supabase
    .from("reward_claims")
    .select("*, reward_item:reward_items(*), user:profiles(*)")
    .order("claimed_at", { ascending: false });

  // Get leaderboard (top 10)
  const { data: leaderboard } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, total_points, current_streak")
    .eq("role", "intern")
    .order("total_points", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rewards</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Manage rewards and view intern achievements"
            : "Earn points and unlock rewards as you progress"}
        </p>
      </div>

      <RewardsOverview
        profile={profile}
        rewards={rewards || []}
        achievements={claims || []}
        leaderboard={leaderboard || []}
        isAdmin={isAdmin}
        userId={user.id}
      />
    </div>
  );
}
