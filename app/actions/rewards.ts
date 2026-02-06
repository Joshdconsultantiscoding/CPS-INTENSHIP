"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Reward } from "@/lib/types";

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
