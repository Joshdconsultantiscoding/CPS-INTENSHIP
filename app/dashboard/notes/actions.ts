"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

export type Note = {
    id: string;
    title: string;
    content: string;
    source: "manual" | "message" | "ai" | "community";
    source_id?: string;
    attachments: string[];
    is_pinned: boolean;
    updated_at: string;
    created_at: string;
};

// Helper to validate UUID
const isUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);

/**
 * Local Backup Helper
 * Saves note data to the local server directory for disaster recovery and speed.
 */
async function saveLocalBackup(userId: string, note: Note) {
    try {
        const backupDir = path.join(process.cwd(), "storage", "backups", "notes", userId);
        await fs.mkdir(backupDir, { recursive: true });
        const filePath = path.join(backupDir, `${note.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(note, null, 2));
    } catch (e) {
        console.error("[Notes Backup] Write failed:", e);
    }
}

async function removeLocalBackup(userId: string, noteId: string) {
    try {
        const filePath = path.join(process.cwd(), "storage", "backups", "notes", userId, `${noteId}.json`);
        await fs.unlink(filePath).catch(() => { }); // Ignore if doesn't exist
    } catch (e) {
        console.error("[Notes Backup] Delete failed:", e);
    }
}

export async function getNotesAction() {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = await createAdminClient();

    try {
        const { data, error } = await supabase
            .from("notes")
            .select("*")
            .eq("user_id", userId)
            .order("is_pinned", { ascending: false })
            .order("updated_at", { ascending: false });

        if (error) throw error;
        return { success: true, data: data as Note[] };
    } catch (error: any) {
        console.error("[Notes] Fetch failed:", error);
        return { success: false, error: error.message };
    }
}

export async function createNoteAction(title: string, content: string, source: string = "manual", source_id?: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = await createAdminClient();

    // Validate inputs
    const safeTitle = title.trim() || "Untitled Note";

    try {
        const { data, error } = await supabase
            .from("notes")
            .insert({
                user_id: userId,
                title: safeTitle,
                content,
                source,
                source_id,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Background local backup
        const note = data as Note;
        await saveLocalBackup(userId, note);

        revalidatePath("/dashboard/notes");
        return { success: true, data: note };
    } catch (error: any) {
        console.error("[Notes] Create failed:", error);
        return { success: false, error: error.message };
    }
}

export async function updateNoteAction(id: string, updates: Partial<Pick<Note, "title" | "content" | "is_pinned" | "attachments">>) {
    if (!id || !isUUID(id)) {
        return { success: false, error: "Invalid Note ID format" };
    }

    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = await createAdminClient();

    try {
        const { data, error } = await supabase
            .from("notes")
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw error;

        // Background local backup
        const note = data as Note;
        await saveLocalBackup(userId, note);

        revalidatePath("/dashboard/notes");
        return { success: true, data: note };
    } catch (error: any) {
        console.error("[Notes] Update failed:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteNoteAction(id: string) {
    if (!id || !isUUID(id)) {
        return { success: false, error: "Invalid Note ID format" };
    }

    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = await createAdminClient();

    try {
        const { error } = await supabase
            .from("notes")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) throw error;

        // Background local backup cleanup
        await removeLocalBackup(userId, id);

        revalidatePath("/dashboard/notes");
        return { success: true };
    } catch (error: any) {
        console.error("[Notes] Delete failed:", error);
        return { success: false, error: error.message };
    }
}

export async function createNoteFromMessageAction(content: string, messageId: string, senderName: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const title = `Note from ${senderName}`;
    const cleanContent = `From message:\n"${content}"\n\n---\nSaved on ${new Date().toLocaleDateString()}`;

    return createNoteAction(title, cleanContent, "message", messageId);
}
