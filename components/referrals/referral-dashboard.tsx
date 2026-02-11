"use client";

import React, { useState, useTransition } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Copy,
    Check,
    Users,
    Trophy,
    Gift,
    Star,
    TrendingUp,
    Clock,
    Zap,
    Crown,
    Medal,
    Share2,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { updatePlatformSettingsAction } from "@/actions/settings";
import {
    redeemReferralRewardAction,
    adminAwardPointsAction,
    adminUpdateReferralStatusAction
} from "@/actions/referrals";
import type { Reward, Redemption, ReferralStats, PlatformSettings } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { Gift as Gifts, Smartphone, Briefcase, Zap as ZapIcon, Badge as BadgeIcon, Settings2, ExternalLink, ShieldAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const rewardIcons: Record<string, React.ReactNode> = {
    gift: <Gift className="h-5 w-5" />,
    smartphone: <Smartphone className="h-5 w-5" />,
    briefcase: <Briefcase className="h-5 w-5" />,
    zap: <ZapIcon className="h-5 w-5" />,
    badge: <BadgeIcon className="h-5 w-5" />,
    sparkles: <Sparkles className="h-5 w-5" />
};

interface ReferralDashboardProps {
    userId: string;
    isAdmin: boolean;
    platformSettings: PlatformSettings | null;
    referralCode: string;
    referralLink: string;
    stats: ReferralStats;
    pointsBalance: number;
    referralHistory: any[];
    pointsHistory: any[];
    leaderboard: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        total_points: number;
        current_streak: number;
    }[];
    rewards: Reward[];
    redemptions: (Redemption & { reward: Reward })[];
    referrersList: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        email: string | null;
        totalReferrals: number;
        confirmedReferrals: number;
    }[];
}

export function ReferralDashboard({
    userId,
    isAdmin,
    referralCode,
    referralLink,
    stats,
    pointsBalance,
    referralHistory,
    pointsHistory,
    leaderboard,
    rewards,
    redemptions,
    platformSettings,
    referrersList,
}: ReferralDashboardProps) {
    const [copied, setCopied] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [redeemingId, setRedeemingId] = useState<string | null>(null);
    const router = useRouter();

    const [optimisticSettings, setOptimisticSettings] = useOptimistic(
        platformSettings,
        (state, newSettings: Partial<PlatformSettings>) => ({
            ...state!,
            ...newSettings,
        })
    );

    useEffect(() => {
        const supabase = createClient();

        // 1. Subscribe to reward items (existing)
        const channelRewards = supabase
            .channel("referral-rewards-sync")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "reward_items" },
                () => router.refresh()
            )
            .subscribe();

        // 2. Subscribe to platform settings (new)
        const channelSettings = supabase
            .channel("platform-settings-sync")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "platform_settings" },
                () => router.refresh()
            )
            .subscribe();

        // 3. Subscribe to all referrals for admin (new)
        let channelReferrals: any = null;
        if (isAdmin) {
            channelReferrals = supabase
                .channel("global-referrals-sync")
                .on(
                    "postgres_changes",
                    { event: "INSERT", schema: "public", table: "referrals" },
                    () => {
                        toast.info("New referral detected on platform!");
                        router.refresh();
                    }
                )
                .subscribe();
        }

        return () => {
            supabase.removeChannel(channelRewards);
            supabase.removeChannel(channelSettings);
            if (channelReferrals) supabase.removeChannel(channelReferrals);
        };
    }, [router, isAdmin]);

    const handleToggleReferralSystem = async (enabled: boolean) => {
        startTransition(async () => {
            setOptimisticSettings({ referral_system_enabled: enabled });
            const result = await updatePlatformSettingsAction({
                referral_system_enabled: enabled,
            });
            if (result.success) {
                toast.success(`Referral system ${enabled ? "enabled" : "disabled"} successfully!`);
            } else {
                toast.error(result.error || "Failed to update settings");
            }
        });
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            toast.success("Referral link copied!");
            setTimeout(() => setCopied(false), 3000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Join CPS Intern",
                    text: "Join me on CPS Intern platform! Use my referral link to get started with bonus points.",
                    url: referralLink,
                });
            } catch {
                // User cancelled share
            }
        } else {
            handleCopy();
        }
    };

    const handleRedeem = (rewardId: string) => {
        setRedeemingId(rewardId);
        startTransition(async () => {
            try {
                const result = await redeemReferralRewardAction(rewardId);
                if (result.success) {
                    const couponCode = (result as any).couponCode;
                    toast.success(
                        couponCode
                            ? `Reward redeemed! Your coupon: ${couponCode}`
                            : "Reward redeemed successfully!"
                    );
                    router.refresh();
                } else {
                    toast.error(result.error || "Failed to redeem reward");
                }
            } catch (error) {
                toast.error("An unexpected error occurred");
            } finally {
                setRedeemingId(null);
            }
        });
    };

    const handleAwardPoints = async (userId: string) => {
        const pointsStr = window.prompt("Enter points to award:", "100");
        if (!pointsStr) return;
        const points = parseInt(pointsStr);
        const reason = window.prompt("Enter reason for awarding points:", "Admin manual award");
        if (!points || !reason) return;

        startTransition(async () => {
            const result = await adminAwardPointsAction(userId, points, reason);
            if (result.success) {
                toast.success(`Awarded ${points} points successfully!`);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to award points");
            }
        });
    };

    const handleUpdateReferralStatus = async (referralId: string, status: "confirmed" | "rejected") => {
        if (!window.confirm(`Are you sure you want to ${status} this referral?`)) return;

        startTransition(async () => {
            const result = await adminUpdateReferralStatusAction(referralId, status);
            if (result.success) {
                toast.success(`Referral ${status} successfully!`);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update status");
            }
        });
    };

    const rankIcons = [
        <Crown key="1" className="h-5 w-5 text-yellow-500" />,
        <Medal key="2" className="h-5 w-5 text-zinc-400" />,
        <Medal key="3" className="h-5 w-5 text-amber-600" />,
    ];

    return (
        <div className="space-y-6">
            <Tabs defaultValue="catalog" className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Referral Program</h2>
                    <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="catalog">Rewards</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="points">Points</TabsTrigger>
                        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                        {isAdmin && (
                            <TabsTrigger value="interns" className="gap-2">
                                <Users className="h-4 w-4" />
                                Management
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-primary/10 p-3">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.confirmedReferrals}</p>
                                    <p className="text-xs text-muted-foreground">Referrals</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-amber-500/10 p-3">
                                    <Star className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{pointsBalance}</p>
                                    <p className="text-xs text-muted-foreground">Points Balance</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-emerald-500/10 p-3">
                                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">#{stats.leaderboardRank || "—"}</p>
                                    <p className="text-xs text-muted-foreground">Leaderboard Rank</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-purple-500/10 p-3">
                                    <Gift className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{redemptions.length}</p>
                                    <p className="text-xs text-muted-foreground">Rewards Claimed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Admin Controls */}
                {
                    isAdmin && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Settings2 className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg text-primary">Admin Control Center</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="referral-system"
                                                checked={optimisticSettings?.referral_system_enabled ?? true}
                                                onCheckedChange={handleToggleReferralSystem}
                                                disabled={isPending}
                                            />
                                            <Label htmlFor="referral-system" className="text-sm font-medium">
                                                {optimisticSettings?.referral_system_enabled ? "System Active" : "System Paused"}
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    As an administrator, you are seeing a <strong>global platform view</strong> of all referrals.
                                    The referral link is disabled for admin accounts to prevent credit loop issues.
                                </p>
                            </CardContent>
                        </Card>
                    )
                }

                {/* Referral Link Card (Intern Only) */}
                {
                    !isAdmin && (
                        <Card className={`overflow-hidden border-2 border-dashed ${optimisticSettings?.referral_system_enabled ? "border-primary/30" : "border-muted opacity-60"}`}>
                            <CardHeader className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Share2 className="h-5 w-5" />
                                    Your Referral Link
                                </CardTitle>
                                <CardDescription>
                                    {optimisticSettings?.referral_system_enabled
                                        ? <>Share this link with friends. You&apos;ll earn <strong>100 points</strong> for each signup!</>
                                        : "The referral program is currently paused by the administrator."
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {!optimisticSettings?.referral_system_enabled ? (
                                    <div className="flex flex-col items-center justify-center py-4 text-center">
                                        <ShieldAlert className="h-12 w-12 text-muted-foreground mb-2" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Referrals are currently disabled. Existing points and rewards are still accessible.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-3 font-mono text-sm break-all">
                                                {referralLink}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={handleCopy}
                                                    variant={copied ? "default" : "outline"}
                                                    className="min-w-[100px]"
                                                >
                                                    {copied ? (
                                                        <>
                                                            <Check className="mr-2 h-4 w-4" /> Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="mr-2 h-4 w-4" /> Copy
                                                        </>
                                                    )}
                                                </Button>
                                                <Button onClick={handleShare} className="gap-2">
                                                    <Share2 className="h-4 w-4" /> Share
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                Code: {referralCode}
                                            </Badge>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )
                }

                {/* Tabs */}

                {/* Leaderboard Tab */}
                <TabsContent value="leaderboard">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Top Referrers
                            </CardTitle>
                            <CardDescription>
                                The most active community ambassadors
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {leaderboard.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        No leaderboard data yet. Be the first to refer someone!
                                    </p>
                                ) : (
                                    leaderboard.map((person, index) => (
                                        <div
                                            key={person.id}
                                            className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${person.id === userId
                                                ? "border-primary/50 bg-primary/5"
                                                : "hover:bg-muted/50"
                                                }`}
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center">
                                                {index < 3 ? (
                                                    rankIcons[index]
                                                ) : (
                                                    <span className="text-sm font-bold text-muted-foreground">
                                                        {index + 1}
                                                    </span>
                                                )}
                                            </div>
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={person.avatar_url || undefined} />
                                                <AvatarFallback>
                                                    {person.full_name?.charAt(0) || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">
                                                    {person.full_name || "Anonymous"}
                                                    {person.id === userId && (
                                                        <Badge variant="outline" className="ml-2 text-[10px]">
                                                            You
                                                        </Badge>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {person.current_streak > 0 &&
                                                        `🔥 ${person.current_streak} day streak`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">
                                                    {person.total_points.toLocaleString()}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                    points
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Rewards Catalog Tab */}
                <TabsContent value="rewards">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gift className="h-5 w-5 text-purple-500" />
                                Reward Catalog
                            </CardTitle>
                            <CardDescription>
                                Redeem your points for exclusive rewards
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {rewards.length === 0 ? (
                                    <p className="col-span-2 text-center text-muted-foreground py-8">
                                        No rewards available yet. Check back soon!
                                    </p>
                                ) : (
                                    rewards.map((reward) => {
                                        const canAfford = pointsBalance >= reward.points_required;
                                        const isExpired =
                                            reward.expires_at && new Date(reward.expires_at) < new Date();
                                        const isSoldOut =
                                            reward.max_redemptions != null &&
                                            (reward.current_redemptions || 0) >= reward.max_redemptions;

                                        return (
                                            <div
                                                key={reward.id}
                                                className={`relative rounded-xl border p-4 transition-all ${canAfford && !isExpired && !isSoldOut
                                                    ? "border-primary/30 hover:border-primary/50 hover:shadow-md"
                                                    : "opacity-60"
                                                    }`}
                                            >
                                                {isSoldOut && (
                                                    <Badge
                                                        variant="destructive"
                                                        className="absolute -top-2 -right-2 text-[10px]"
                                                    >
                                                        Sold Out
                                                    </Badge>
                                                )}
                                                {isExpired && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="absolute -top-2 -right-2 text-[10px]"
                                                    >
                                                        Expired
                                                    </Badge>
                                                )}

                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/10 to-transparent p-6 shadow-xl">
                                                        {rewardIcons[reward.icon || "gift"] || <Sparkles className="h-5 w-5 text-purple-500" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm">{reward.name}</h3>
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                            {reward.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {reward.reward_type?.replace("_", " ") || "badge"}
                                                            </Badge>
                                                            <span className="text-xs font-bold text-primary">
                                                                {reward.points_required} pts
                                                            </span>
                                                        </div>
                                                        {reward.expires_at && !isExpired && (
                                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                                Expires:{" "}
                                                                {new Date(reward.expires_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <Progress
                                                        value={Math.min(
                                                            100,
                                                            (pointsBalance / reward.points_required) * 100
                                                        )}
                                                        className="h-1.5"
                                                    />
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {pointsBalance}/{reward.points_required} pts
                                                        </span>
                                                        {!isAdmin && (
                                                            <Button
                                                                size="sm"
                                                                variant={canAfford ? "default" : "outline"}
                                                                className="h-7 text-xs gap-1"
                                                                disabled={
                                                                    !canAfford ||
                                                                    !!isExpired ||
                                                                    !!isSoldOut ||
                                                                    isPending ||
                                                                    redeemingId === reward.id
                                                                }
                                                                onClick={() => handleRedeem(reward.id)}
                                                            >
                                                                {redeemingId === reward.id ? (
                                                                    "Redeeming..."
                                                                ) : canAfford ? (
                                                                    <>
                                                                        Redeem <ArrowRight className="h-3 w-3" />
                                                                    </>
                                                                ) : (
                                                                    "Not enough pts"
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Referral History Tab */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Referral History</CardTitle>
                            <CardDescription>
                                People who joined through your link
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {referralHistory.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No referrals yet. Share your link to get started!
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {referralHistory.map((ref: any) => (
                                        <div
                                            key={ref.id}
                                            className="flex items-center gap-3 rounded-lg border p-3"
                                        >
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage
                                                    src={ref.referred?.avatar_url || undefined}
                                                />
                                                <AvatarFallback>
                                                    {ref.referred?.full_name?.charAt(0) || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm truncate">
                                                        {ref.referred?.full_name || "Unknown User"}
                                                    </p>
                                                    {isAdmin && ref.referrer && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <ArrowRight className="h-2 w-2" />
                                                            <span>via {ref.referrer.full_name || "Unknown"}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Joined{" "}
                                                    {new Date(ref.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        ref.status === "confirmed"
                                                            ? "default"
                                                            : ref.status === "rejected"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                    className="text-xs"
                                                >
                                                    {ref.status}
                                                </Badge>
                                                {isAdmin && ref.status === "pending" && (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                                                            onClick={() => handleUpdateReferralStatus(ref.id, "confirmed")}
                                                            title="Confirm Referral"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-500 hover:bg-red-500/10"
                                                            onClick={() => handleUpdateReferralStatus(ref.id, "rejected")}
                                                            title="Reject Referral"
                                                        >
                                                            <ShieldAlert className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Points History Tab */}
                <TabsContent value="points">
                    <Card>
                        <CardHeader>
                            <CardTitle>Points History</CardTitle>
                            <CardDescription>
                                All your point transactions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pointsHistory.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No point transactions yet.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {pointsHistory.map((entry: any) => (
                                        <div
                                            key={entry.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`rounded-full p-2 ${entry.points > 0
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-red-500/10 text-red-500"
                                                        }`}
                                                >
                                                    {entry.points > 0 ? (
                                                        <TrendingUp className="h-4 w-4" />
                                                    ) : (
                                                        <Gift className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{entry.reason}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(entry.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`font-bold text-sm ${entry.points > 0
                                                    ? "text-emerald-500"
                                                    : "text-red-500"
                                                    }`}
                                            >
                                                {entry.points > 0 ? "+" : ""}
                                                {entry.points}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                {/* Management Tab Content */}
                {isAdmin && (
                    <TabsContent value="interns">
                        <Card>
                            <CardHeader>
                                <CardTitle>Referrer Management</CardTitle>
                                <CardDescription>
                                    All interns who have made referrals on the platform
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {referrersList?.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            No referrers found yet.
                                        </p>
                                    ) : (
                                        referrersList?.map((referrer) => (
                                            <div
                                                key={referrer.id}
                                                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                                            >
                                                <div className="flex flex-1 items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={referrer.avatar_url || undefined} />
                                                        <AvatarFallback>
                                                            {referrer.full_name?.charAt(0) || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {referrer.full_name || "Anonymous"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {referrer.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold">{referrer.totalReferrals}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-bold text-emerald-500">{referrer.confirmedReferrals}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase">Confirmed</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleAwardPoints(referrer.id)}
                                                        className="gap-2"
                                                    >
                                                        <Star className="h-4 w-4 text-amber-500" />
                                                        Award Points
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
