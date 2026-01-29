"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Reward, Achievement } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Trophy,
  Star,
  Gift,
  Flame,
  Medal,
  Lock,
  Check,
  Crown,
  Zap,
  Award,
  Target,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { RewardDialog } from "./reward-dialog";

interface RewardsOverviewProps {
  profile: Profile | null;
  rewards: Reward[];
  achievements: (Achievement & { reward: Reward })[];
  leaderboard: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    total_points: number;
    current_streak: number;
  }[];
  isAdmin: boolean;
  userId: string;
}

const rewardIcons: Record<string, React.ReactNode> = {
  trophy: <Trophy className="h-6 w-6" />,
  star: <Star className="h-6 w-6" />,
  medal: <Medal className="h-6 w-6" />,
  crown: <Crown className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
  award: <Award className="h-6 w-6" />,
  target: <Target className="h-6 w-6" />,
  gift: <Gift className="h-6 w-6" />,
};

export function RewardsOverview({
  profile,
  rewards,
  achievements,
  leaderboard,
  isAdmin,
  userId,
}: RewardsOverviewProps) {
  const router = useRouter();
  const [claiming, setClaiming] = useState<string | null>(null);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | undefined>(undefined);

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("rewards").delete().eq("id", rewardId);

    if (error) {
      toast.error("Failed to delete reward");
      return;
    }

    toast.success("Reward deleted successfully");
    router.refresh();
  };

  const userPoints = profile?.total_points || 0;
  const earnedRewardIds = achievements.map((a) => a.reward_id);

  const claimReward = async (reward: Reward) => {
    if (userPoints < reward.points_required) {
      toast.error("Not enough points to claim this reward");
      return;
    }

    if (earnedRewardIds.includes(reward.id)) {
      toast.error("You've already earned this reward");
      return;
    }

    setClaiming(reward.id);
    const supabase = createClient();

    // Create achievement
    const { error: achievementError } = await supabase
      .from("achievements")
      .insert({
        user_id: userId,
        reward_id: reward.id,
      });

    if (achievementError) {
      toast.error("Failed to claim reward");
      setClaiming(null);
      return;
    }

    // Deduct points
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        total_points: userPoints - reward.points_required,
      })
      .eq("id", userId);

    if (profileError) {
      toast.error("Failed to update points");
      setClaiming(null);
      return;
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Reward Claimed!",
      message: `You've successfully claimed: ${reward.name}`,
      type: "achievement",
    });

    toast.success(`Congratulations! You've earned: ${reward.name}`);
    setClaiming(null);
    router.refresh();
  };

  const userRank = leaderboard.findIndex((u) => u.id === userId) + 1;

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Points</CardTitle>
            <Trophy className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userPoints}</div>
            <p className="text-xs text-muted-foreground">
              Keep earning to unlock more rewards!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile?.current_streak || 0} days</div>
            <p className="text-xs text-muted-foreground">
              Best: {profile?.longest_streak || 0} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
            <Medal className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userRank > 0 ? `#${userRank}` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {leaderboard.length} interns
            </p>
          </CardContent>
        </Card>
      </div>

      <RewardDialog
        open={isRewardDialogOpen}
        onOpenChange={setIsRewardDialogOpen}
        reward={editingReward}
      />

      <Tabs defaultValue="available" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="available">Available Rewards</TabsTrigger>
            <TabsTrigger value="earned">
              {isAdmin ? "All Claims" : "Your Collection"}
            </TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {isAdmin && (
            <Button
              onClick={() => {
                setEditingReward(undefined);
                setIsRewardDialogOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Reward
            </Button>
          )}
        </div>

        {/* Available Rewards */}
        <TabsContent value="available" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => {
              const isEarned = earnedRewardIds.includes(reward.id);
              const canClaim = userPoints >= reward.points_required && !isEarned;
              const progress = Math.min(
                100,
                Math.round((userPoints / reward.points_required) * 100)
              );

              return (
                <Card
                  key={reward.id}
                  className={isEarned ? "border-accent bg-accent/5" : ""}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        {rewardIcons[reward.icon || "gift"]}
                      </div>
                      <div className="flex gap-1">
                        {isAdmin && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                setEditingReward(reward);
                                setIsRewardDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteReward(reward.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {isEarned && (
                          <Badge variant="secondary" className="gap-1">
                            <Check className="h-3 w-3" />
                            Earned
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-lg">{reward.name}</CardTitle>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Required Points</span>
                        <span className="font-medium">{reward.points_required}</span>
                      </div>
                      {!isEarned && (
                        <>
                          <Progress value={progress} />
                          <p className="text-xs text-muted-foreground">
                            {userPoints}/{reward.points_required} points (
                            {progress}%)
                          </p>
                        </>
                      )}
                      {!isAdmin && !isEarned && (
                        <Button
                          className="w-full"
                          onClick={() => claimReward(reward)}
                          disabled={!canClaim || claiming === reward.id}
                        >
                          {claiming === reward.id ? (
                            "Claiming..."
                          ) : canClaim ? (
                            <>
                              <Gift className="mr-2 h-4 w-4" />
                              Claim Reward
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              {reward.points_required - userPoints} more points needed
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Claims / Achievements */}
        <TabsContent value="earned" className="mt-4">
          {achievements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  {isAdmin ? "No claims recorded" : "No achievements yet"}
                </h3>
                <p className="mt-2 text-center text-muted-foreground">
                  {isAdmin
                    ? "Interns' claimed rewards will appear here."
                    : "Start earning points to unlock your first reward!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="border-accent bg-accent/5 overflow-hidden">
                  {isAdmin && achievement.user && (
                    <div className="bg-accent/10 px-4 py-2 border-b border-accent/20 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={achievement.user.avatar_url || ""} />
                        <AvatarFallback className="text-[10px]">
                          {achievement.user.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold truncate">
                        {achievement.user.full_name}
                      </span>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        {rewardIcons[achievement.reward.icon || "gift"] || (
                          <Gift className="h-6 w-6" />
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          {format(new Date(achievement.earned_at), "MMM d, yyyy")}
                        </Badge>
                        <span className="text-xs font-bold text-accent">
                          {achievement.reward.points_required} Points
                        </span>
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-base leading-tight">
                      {achievement.reward.name}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {achievement.reward.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Interns ranked by total points earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((user, index) => {
                  const isCurrentUser = user.id === userId;
                  const rankBadge =
                    index === 0
                      ? "bg-chart-3 text-chart-3-foreground"
                      : index === 1
                        ? "bg-muted text-muted-foreground"
                        : index === 2
                          ? "bg-chart-4/20 text-chart-4"
                          : "bg-secondary text-secondary-foreground";

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between rounded-lg p-3 ${isCurrentUser ? "bg-primary/5 ring-1 ring-primary" : "border"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${rankBadge}`}
                        >
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback>
                            {user.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.full_name || "Anonymous"}
                            {isCurrentUser && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                (You)
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Flame className="h-3 w-3" />
                            {user.current_streak} day streak
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-chart-3" />
                        <span className="text-xl font-bold">
                          {user.total_points || 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
