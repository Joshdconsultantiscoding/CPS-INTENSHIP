"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Achievement, Reward } from "@/lib/types";
import { createNotification } from "@/lib/notifications/notification-service";

/**
 * Creates a new reward in the catalog.
 * Only accessible by admins.
 */
export async function createRewardAction(data: Omit<Reward, "id" | "created_at">) {
    try {
        const user = await getAuthUser();

        if (user.role !== "admin") {
            throw new Error("Unauthorized: Only admins can create rewards");
        }

        const adminClient = await createAdminClient();
        const { data: reward, error } = await adminClient
            .from("rewards")
            .insert({
                name: data.name,
                description: data.description,
                points_required: data.points_required,
                icon: data.icon,
                is_active: data.is_active ?? true,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating reward:", error);
            return { success: false, error: error.message };
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
 * Updates an existing reward in the catalog.
 * Only accessible by admins.
 */
export async function updateRewardAction(id: string, data: Partial<Omit<Reward, "id" | "created_at">>) {
    try {
        const user = await getAuthUser();

        if (user.role !== "admin") {
            throw new Error("Unauthorized: Only admins can update rewards");
        }

        const adminClient = await createAdminClient();
        const { data: reward, error } = await adminClient
            .from("rewards")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error updating reward:", error);
            return { success: false, error: error.message };
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
 * Deletes a reward from the catalog.
 * Only accessible by admins.
 */
export async function deleteRewardAction(id: string) {
    try {
        const user = await getAuthUser();

        if (user.role !== "admin") {
            throw new Error("Unauthorized: Only admins can delete rewards");
        }

        const adminClient = await createAdminClient();
        const { error } = await adminClient
            .from("rewards")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting reward:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/rewards");
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
export async function claimRewardAction(rewardId: string) {
    try {
        const user = await getAuthUser();
        const adminClient = await createAdminClient();

        // 1. Fetch reward and profile
        const [{ data: reward, error: rErr }, { data: profile, error: pErr }] = await Promise.all([
            adminClient.from("rewards").select("*").eq("id", rewardId).single(),
            adminClient.from("profiles").select("total_points, full_name, role").eq("id", user.id).single()
        ]);

        if (rErr || !reward) throw new Error("Reward not found");
        if (pErr || !profile) throw new Error("Profile not found");

        // 2. Validate
        if (profile.total_points < reward.points_required) {
            throw new Error("Insufficient points");
        }

        // 3. Check for existing achievement
        const { data: existing } = await adminClient
            .from("achievements")
            .select("id")
            .eq("user_id", user.id)
            .eq("reward_id", rewardId)
            .maybeSingle();

        if (existing) throw new Error("Reward already claimed");

        // 4. Atomic-ish update (Supabase doesn't have multi-table transactions in JS easily without RPC, but we'll sequentialize)
        const { error: achievementErr } = await adminClient.from("achievements").insert({
            user_id: user.id,
            reward_id: rewardId
        });
        if (achievementErr) throw achievementErr;

        const { error: pointsErr } = await adminClient
            .from("profiles")
            .update({ total_points: profile.total_points - reward.points_required })
            .eq("id", user.id);
        if (pointsErr) throw pointsErr;

        // 5. Notifications
        // celebrate for intern
        await createNotification({
            userId: user.id,
            title: "🎁 Reward Claimed!",
            message: `Congratulations! You've successfully claimed: ${reward.name}`,
            type: "reward",
            link: `/dashboard/rewards`,
            priority: 'high',
            sound: 'success',
            metadata: { rewardId }
        });

        // alert admins
        const { data: admins } = await adminClient.from("profiles").select("id").eq("role", "admin");
        if (admins) {
            for (const admin of admins) {
                await createNotification({
                    userId: admin.id,
                    title: "Reward Claimed",
                    message: `${profile.full_name || user.email} just claimed '${reward.name}'`,
                    type: "system",
                    link: `/dashboard/rewards`,
                    priority: 'normal',
                    metadata: { internId: user.id, rewardId }
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
