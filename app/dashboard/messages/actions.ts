"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ensureProfileSync } from "@/lib/profile-sync";

/** Mark messages as delivered when recipient fetches (for delivery ticks). */
export async function markDeliveredAction(messageIds: string[]) {
    try {
        if (messageIds.length === 0) return { success: true };
        const user = await getAuthUser();
        const supabase = await createAdminClient();
        const now = new Date().toISOString();
        const { error } = await supabase
            .from("messages")
            .update({ status: "delivered", delivered_at: now })
            .in("id", messageIds)
            .eq("recipient_id", user.id)
            .eq("status", "sent");
        if (error) {
            console.error("MarkDelivered Error:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (error: any) {
        console.error("MarkDeliveredAction Error:", error);
        return { success: false, error: error.message };
    }
}

/** Fetch messages for a conversation using admin client (bypasses RLS). Ensures sent messages are always visible. */
export async function getMessagesAction(recipientId: string | null, channelId: string | null) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        let query = supabase.from("messages").select("*").order("created_at", { ascending: true });

        if (channelId) {
            query = query.eq("channel_id", channelId);
        } else if (recipientId) {
            query = query
                .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
                .is("channel_id", null);
        } else {
            return { success: true, data: [] };
        }

        const { data, error } = await query;

        if (error) {
            console.error("GetMessages Error:", error);
            return { success: false, error: error.message, data: [] };
        }
        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error("GetMessagesAction Error:", error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function sendMessageAction(
    content: string,
    recipientId: string | null,
    channelId: string | null,
    attachments: string[] = []
) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        if (!content && attachments.length === 0) {
            throw new Error("Message content or attachment required");
        }

        // Ensure Profile Exists Safely (Don't overwrite custom avatars)
        const syncResult = await ensureProfileSync(user, supabase);

        if (!syncResult.success) {
            console.error("Profile Sync Failed in SendMessage:", syncResult.error);

            // Handle specific migration case if it was a duplicate key (ID collision)
            if (syncResult.error?.includes("duplicate key") && user.email) {
                // Specific migration logic for email collisions
                const { data: staleProfile } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("email", user.email)
                    .single();

                if (staleProfile && staleProfile.id !== user.id) {
                    const oldId = staleProfile.id;
                    console.log(`[SendMessage] Migrating ID: ${oldId} → ${user.id}`);

                    // Step 1: Create NEW profile with Clerk ID first (before updating refs)
                    const { error: createErr } = await supabase.from("profiles").insert({
                        id: user.id,
                        email: `migrated_${Date.now()}@temp.local`,
                        full_name: user.full_name,
                        avatar_url: user.avatar_url,
                        role: user.role,
                        updated_at: new Date().toISOString(),
                    });

                    if (createErr && createErr.code !== '23505') {
                        console.error("[SendMessage] Failed to create new profile:", createErr);
                    }

                    // Step 2: Update all message FK references from old ID to new ID
                    await supabase.from("messages").update({ sender_id: user.id }).eq("sender_id", oldId);
                    await supabase.from("messages").update({ recipient_id: user.id }).eq("recipient_id", oldId);

                    // Step 3: Delete old profile 
                    await supabase.from("profiles").delete().eq("id", oldId);

                    // Step 4: Fix the email on our new profile
                    await supabase.from("profiles").update({
                        email: user.email,
                        full_name: user.full_name,
                        avatar_url: user.avatar_url,
                    }).eq("id", user.id);

                    console.log("[SendMessage] Profile ID migration completed.");
                }
            }
        }

        const { data, error } = await supabase
            .from("messages")
            .insert({
                content,
                sender_id: user.id,
                recipient_id: recipientId,
                channel_id: channelId,
                attachments,
                status: "sent",
            })
            .select("*")
            .single();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw new Error(error.message);
        }

        return { success: true, message: data };
    } catch (error: any) {
        console.error("SendMessageAction Error:", error);
        return { success: false, error: error.message };
    }
}

/** Log a call as a structured message (for call indicator in chat). */
export async function sendCallLogAction(
    recipientId: string,
    callType: "voice" | "video",
    callStatus: "missed" | "completed",
    callDuration: string
) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from("messages")
            .insert({
                content: "",
                sender_id: user.id,
                recipient_id: recipientId,
                channel_id: null,
                attachments: [],
                status: "sent",
                message_type: "call",
                call_type: callType,
                call_status: callStatus,
                call_duration: callDuration,
            })
            .select("*")
            .single();

        if (error) {
            console.error("SendCallLog Error:", error);
            throw new Error(error.message);
        }
        return { success: true, message: data };
    } catch (error: any) {
        console.error("SendCallLogAction Error:", error);
        return { success: false, error: error.message };
    }
}

export async function clearChatAction(targetId: string, isChannel: boolean) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        let query = supabase.from("messages").delete();

        if (isChannel) {
            query = query.eq("channel_id", targetId);
        } else {
            // Delete DMs between user and target
            query = query.or(`and(sender_id.eq.${user.id},recipient_id.eq.${targetId}),and(sender_id.eq.${targetId},recipient_id.eq.${user.id})`);
        }

        const { error } = await query;

        if (error) {
            console.error("ClearChat Error:", error);
            throw new Error(error.message);
        }

        revalidatePath("/dashboard/messages");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
