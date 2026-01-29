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

  // Get all rewards
  const { data: rewards } = await supabase
    .from("rewards")
    .select("*")
    .eq("is_active", true)
    .order("points_required", { ascending: true });

  // Get achievements
  let achievementsQuery = supabase
    .from("achievements")
    .select("*, reward:rewards(*), user:profiles(*)");

  if (!isAdmin) {
    achievementsQuery = achievementsQuery.eq("user_id", user.id);
  }

  const { data: achievements } = await achievementsQuery.order("earned_at", { ascending: false });

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
        achievements={achievements || []}
        leaderboard={leaderboard || []}
        isAdmin={isAdmin}
        userId={user.id}
      />
    </div>
  );
}
