"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Reward, RewardClaim } from "@/lib/types";
import { createNotification } from "@/lib/notifications/notification-service";
import { getAblyAdmin } from "@/lib/ably-server";

/**
 * Creates a new reward in the catalogue.
 */
export async function createRewardAction(data: Omit<Reward, "id" | "created_at" | "updated_at">) {
    try {
        const user = await getAuthUser();

        if (user.role !== "admin") {
            throw new Error("Unauthorized: Only admins can create rewards");
        }

        const adminClient = await createAdminClient();

        const { data: reward, error } = await adminClient
            .from("reward_items")
            .insert({
                name: data.name.trim(),
                description: data.description,
                points_required: data.points_required,
                icon: data.icon,
                is_active: data.is_active ?? true,
                expires_at: data.expires_at,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating reward:", error);
            return { success: false, error: error.message };
        }

        // Publish to Ably for real-time update
        const ably = getAblyAdmin();
        if (ably) {
            try {
                const channel = ably.channels.get("rewards:global");
                await channel.publish("reward-created", { reward });
            } catch (e) {
                console.warn("Ably publish failed:", e);
            }
        }

        revalidatePath("/dashboard/rewards");
        return { success: true, data: reward };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("Server Action Error (createReward):", error);
        return { success: false, error: error.message || "Internal server error" };
    }
}

/**
 * Updates an existing reward in the catalogue.
 */
export async function updateRewardAction(id: string, data: Partial<Omit<Reward, "id" | "created_at" | "updated_at">>) {
    try {
        const user = await getAuthUser();

        if (user.role !== "admin") {
            throw new Error("Unauthorized: Only admins can update rewards");
        }

        const adminClient = await createAdminClient();
        const { data: reward, error } = await adminClient
            .from("reward_items")
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating reward:", error);
            return { success: false, error: error.message };
        }

        // Publish to Ably for real-time update
        const ably = getAblyAdmin();
        if (ably) {
            try {
                const channel = ably.channels.get("rewards:global");
                await channel.publish("reward-updated", { reward });
            } catch (e) {
                console.warn("Ably publish failed:", e);
            }
        }

        revalidatePath("/dashboard/rewards");
        return { success: true, data: reward };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("Server Action Error (updateReward):", error);
        return { success: false, error: error.message || "Internal server error" };
    }
}

/**
 * Archives a reward (soft delete).
 */
export async function deleteRewardAction(id: string) {
    try {
        const user = await getAuthUser();

        if (user.role !== "admin") {
            throw new Error("Unauthorized: Only admins can archive rewards");
        }

        const adminClient = await createAdminClient();
        const { error } = await adminClient
            .from("reward_items")
            .update({
                archived_at: new Date().toISOString(),
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);

        if (error) {
            console.error("Error archiving reward:", error);
            return { success: false, error: error.message };
        }

        // Publish to Ably for real-time update
        const ably = getAblyAdmin();
        if (ably) {
            try {
                const channel = ably.channels.get("rewards:global");
                await channel.publish("reward-deleted", { rewardId: id });
            } catch (e) {
                console.warn("Ably publish failed:", e);
            }
        }

        revalidatePath("/dashboard/rewards");

        // Notify Interns
        try {
            const { broadcastNotification } = await import("@/lib/notifications/notification-service");
            await broadcastNotification({
                title: "Reward Removed",
                message: `A reward has been removed from the catalog.`,
                type: "system",
                link: "/dashboard/rewards"
            });
        } catch (e) {
            console.warn("Notification broadcast failed:", e);
        }

        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("Server Action Error (deleteReward):", error);
        return { success: false, error: error.message || "Internal server error" };
    }
}

/**
 * Handles intern claiming a reward securely.
 */
export async function claimRewardAction(rewardItemId: string) {
    try {
        const user = await getAuthUser();
        const adminClient = await createAdminClient();

        // 1. Fetch reward and profile
        const [{ data: reward, error: rErr }, { data: profile, error: pErr }] = await Promise.all([
            adminClient.from("reward_items").select("*").eq("id", rewardItemId).single(),
            adminClient.from("profiles").select("total_points, full_name, role").eq("id", user.id).single()
        ]);

        if (rErr || !reward) throw new Error("Reward not found");
        if (pErr || !profile) throw new Error("Profile not found");

        // 2. Validate
        if (profile.total_points < reward.points_required) {
            throw new Error(`Insufficient points. You need ${reward.points_required} but have ${profile.total_points}.`);
        }

        // 3. Check for existing claim (if one per person)
        const { data: existing } = await adminClient
            .from("reward_claims")
            .select("id")
            .eq("user_id", user.id)
            .eq("reward_item_id", rewardItemId)
            .eq("status", "pending")
            .maybeSingle();

        if (existing) throw new Error("You already have a pending claim for this reward.");

        // 4. Atomic operation via RPC or sequential (sequential here for simplicity, but RPC is better for high load)
        const { error: claimErr } = await adminClient.from("reward_claims").insert({
            user_id: user.id,
            reward_item_id: rewardItemId,
            status: "pending"
        });
        if (claimErr) throw claimErr;

        // Deduct points
        const { error: pointsErr } = await adminClient
            .from("profiles")
            .update({ total_points: profile.total_points - reward.points_required })
            .eq("id", user.id);
        if (pointsErr) throw pointsErr;

        // 5. Notifications
        await createNotification({
            userId: user.id,
            title: "🎁 Reward Claimed!",
            message: `Congratulations! You've successfully claimed: ${reward.name}. Points deducted: ${reward.points_required}`,
            type: "achievement",
            link: `/dashboard/rewards`,
        });

        // Notify Admins
        const { data: admins } = await adminClient.from("profiles").select("id").eq("role", "admin");
        if (admins) {
            for (const admin of admins) {
                await createNotification({
                    userId: admin.id,
                    title: "New Reward Claim",
                    message: `${profile.full_name || user.email} just claimed '${reward.name}'`,
                    type: "system",
                    link: `/dashboard/rewards`,
                });
            }
        }

        revalidatePath("/dashboard/rewards");
        return { success: true };
    } catch (error: any) {
        console.error("Server Action Error (claimReward):", error);
        return { success: false, error: error.message };
    }
}
