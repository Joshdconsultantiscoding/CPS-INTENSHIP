"use server";

import { getAuthUser } from "@/lib/auth";
import { ReferralService } from "@/lib/services/referral-service";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/navigation";

/**
 * Get the current user's referral link.
 */
export async function getMyReferralLinkAction() {
    try {
        const user = await getAuthUser();
        const code = await ReferralService.getOrCreateReferralCode(user.id);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cpsintern.com";
        return {
            success: true,
            code,
            link: `${baseUrl}/auth/sign-up?ref=${code}`,
        };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[getMyReferralLinkAction] Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get referral stats for the current user.
 */
export async function getMyReferralStatsAction() {
    try {
        const user = await getAuthUser();
        const stats = await ReferralService.getReferralStats(user.id);
        const balance = await ReferralService.getPointsBalance(user.id);
        return { success: true, stats, balance };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        return { success: false, error: error.message };
    }
}

/**
 * Get referral history (who the user referred).
 */
export async function getMyReferralHistoryAction() {
    try {
        const user = await getAuthUser();
        const history = await ReferralService.getReferralHistory(user.id);
        return { success: true, history };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        return { success: false, error: error.message };
    }
}

/**
 * Get points transaction history.
 */
export async function getMyPointsHistoryAction() {
    try {
        const user = await getAuthUser();
        const history = await ReferralService.getPointsHistory(user.id);
        return { success: true, history };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        return { success: false, error: error.message };
    }
}

/**
 * Redeem a reward using referral points.
 */
export async function redeemReferralRewardAction(rewardId: string) {
    try {
        const user = await getAuthUser();
        const result = await ReferralService.redeemReward(user.id, rewardId);

        if (result.success) {
            revalidatePath("/dashboard/referrals");
            revalidatePath("/dashboard/rewards");
        }

        return result;
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        return { success: false, error: error.message };
    }
}

/**
 * Admin: Create a new typed reward.
 */
export async function adminCreateTypedRewardAction(data: {
    name: string;
    description: string;
    points_required: number;
    icon: string;
    reward_type: string;
    reward_value: Record<string, unknown>;
    expires_at?: string;
    max_redemptions?: number;
}) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();
        const { data: reward, error } = await supabase
            .from("reward_items")
            .insert({
                name: data.name,
                description: data.description,
                points_required: data.points_required,
                icon: data.icon || "gift",
                is_active: true,
                reward_type: data.reward_type,
                reward_value: data.reward_value,
                expires_at: data.expires_at || null,
                max_redemptions: data.max_redemptions || null,
            })
            .select()
            .single();

        if (error) {
            console.error("[adminCreateTypedRewardAction] Error:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/referrals");
        revalidatePath("/dashboard/rewards");
        return { success: true, reward };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        return { success: false, error: error.message };
    }
}

/**
 * Admin: Toggle a reward's active state.
 */
export async function adminToggleRewardAction(rewardId: string, active: boolean) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();
        const { error } = await supabase
            .from("reward_items")
            .update({ is_active: active })
            .eq("id", rewardId);

        if (error) return { success: false, error: error.message };

        // Notify Interns if deactivated
        if (!active) {
            const { broadcastNotification } = await import("@/lib/notifications/notification-service");
            await broadcastNotification({
                title: "Reward Updated",
                message: `A reward has been updated or temporarily disabled.`,
                type: "system",
                link: "/dashboard/rewards"
            });
        }

        revalidatePath("/dashboard/referrals");
        revalidatePath("/dashboard/rewards");
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        return { success: false, error: error.message };
    }
}

/**
 * Process a referral code during signup.
 * Called from the webhook or signup flow.
 */
export async function processReferralCodeAction(
    referredUserId: string,
    code: string,
    ipAddress?: string
) {
    try {
        const result = await ReferralService.processReferral(
            referredUserId,
            code,
            ipAddress
        );
        if (result.success) {
            revalidatePath("/dashboard/referrals");
        }
        return result;
    } catch (error: any) {
        console.error("[processReferralCodeAction] Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Admin: Manually award points to a user.
 */
export async function adminAwardPointsAction(userId: string, points: number, reason: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") return { success: false, error: "Unauthorized" };

        const result = await ReferralService.awardPoints(userId, points, reason);
        if (result.success) {
            revalidatePath("/dashboard/referrals");
        }
        return result;
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        return { success: false, error: error.message };
    }
}

/**
 * Admin: Confirm or reject a referral manually.
 */
export async function adminUpdateReferralStatusAction(referralId: string, status: "confirmed" | "rejected") {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") return { success: false, error: "Unauthorized" };

        const result = await ReferralService.updateReferralStatus(referralId, status);
        if (result.success) {
            revalidatePath("/dashboard/referrals");
        }
        return result;
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        return { success: false, error: error.message };
    }
}
