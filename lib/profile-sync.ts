import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures a user profile exists in the database without overwriting existing data.
 * This prevents Clerk metadata from resetting custom-uploaded avatars during 
 * secondary actions like creating posts or sending messages.
 */
export async function ensureProfileSync(user: any, supabase: SupabaseClient) {
    if (!user?.id) return { success: false, error: "Missing user ID" };

    try {
        // 1. Check if profile already exists
        const { data: existing, error: fetchError } = await supabase
            .from("profiles")
            .select("id, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

        if (fetchError) {
            console.error("[ProfileSync] Fetch error:", fetchError);
            return { success: false, error: fetchError.message };
        }

        // 2. If it doesn't exist, create it (INSERT)
        if (!existing) {
            console.log(`[ProfileSync] Creating new profile for: ${user.id}`);
            const { error: insertError } = await supabase.from("profiles").insert({
                id: user.id,
                email: user.email || "",
                full_name: user.full_name || "New User",
                avatar_url: user.avatar_url || null,
                role: user.role || "intern",
                updated_at: new Date().toISOString(),
            });

            if (insertError) {
                console.error("[ProfileSync] Insert error:", insertError);
                return { success: false, error: insertError.message };
            }

            // 3. Notify Admins about the new intern
            try {
                const { createNotification } = await import("./notifications/notification-service");
                const { data: admins } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("role", "admin");

                if (admins) {
                    for (const admin of admins) {
                        await createNotification({
                            userId: admin.id,
                            title: "New Intern Registered",
                            message: `New intern '${user.full_name || user.email}' just joined the platform.`,
                            type: "system",
                            link: `/dashboard/interns`,
                            priority: 'normal',
                            metadata: { internId: user.id }
                        });
                    }
                }
            } catch (notifErr) {
                console.warn("[ProfileSync] Admin notification failed:", notifErr);
            }
        } else {
            // 3. If it DOES exist, we do nothing to the avatar/name.
            // We might want to update last_active_at or similar if needed,
            // but we avoid destructive overwrites of user-controlled fields.
            // console.log(`[ProfileSync] Profile already exists for: ${user.id}, preserving existing data.`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("[ProfileSync] Unexpected error:", error);
        return { success: false, error: error.message };
    }
}
