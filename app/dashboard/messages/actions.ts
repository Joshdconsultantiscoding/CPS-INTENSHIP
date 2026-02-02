"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
