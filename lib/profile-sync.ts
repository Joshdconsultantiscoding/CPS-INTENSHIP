import { SupabaseClient } from "@supabase/supabase-js";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

/**
 * Generates a fallback avatar URL using DiceBear API.
 * Deterministic based on seed so same user always gets same avatar.
 */
function getFallbackAvatar(seed: string): string {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0ea5e9,8b5cf6,ec4899,f97316&backgroundType=gradientLinear`;
}

/**
 * Generates a username from email or name.
 * e.g., "john.doe@gmail.com" → "john-doe", "Jane Smith" → "jane-smith"
 */
function generateUsername(email?: string, fullName?: string): string {
    if (fullName && fullName !== "New User") {
        return fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
    }
    if (email) {
        const local = email.split("@")[0] || "user";
        return local.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
    }
    return `user-${Date.now().toString(36)}`;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ensures a user profile exists in the database without overwriting existing data.
 * This prevents Clerk metadata from resetting custom-uploaded avatars during
 * secondary actions like creating posts or sending messages.
 *
 * Features:
 * - Retry logic (3 attempts with exponential backoff)
 * - Auto-generates username and slug
 * - Guarantees a fallback avatar (never null)
 */
export async function ensureProfileSync(user: any, supabase: SupabaseClient) {
    if (!user?.id) return { success: false, error: "Missing user ID" };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            // 1. Check if profile already exists
            const { data: existing, error: fetchError } = await supabase
                .from("profiles")
                .select("id, avatar_url, full_name, email, role, username")
                .eq("id", user.id)
                .maybeSingle();

            if (fetchError) {
                console.error(`[ProfileSync] Fetch error (attempt ${attempt + 1}):`, fetchError);
                if (attempt < MAX_RETRIES - 1) {
                    await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
                    continue;
                }
                return { success: false, error: fetchError.message };
            }

            // 2. If it doesn't exist, create it
            if (!existing) {
                const fullName = user.full_name || "New User";
                const email = user.email || "";
                const username = generateUsername(email, fullName);
                const avatarUrl = user.avatar_url || getFallbackAvatar(fullName);

                console.log(`[ProfileSync] Creating new profile for: ${user.id} (username: ${username})`);
                const { error: insertError } = await supabase.from("profiles").insert({
                    id: user.id,
                    email,
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    role: user.role || "intern",
                    username,
                    updated_at: new Date().toISOString(),
                });

                if (insertError) {
                    // Handle duplicate key (race condition — profile was created between check and insert)
                    if (insertError.code === "23505") {
                        console.warn(`[ProfileSync] Race condition: profile already exists for ${user.id}, retrying...`);
                        if (attempt < MAX_RETRIES - 1) {
                            await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
                            continue;
                        }
                        // On final retry, just return success since profile exists
                        return { success: true };
                    }
                    console.error(`[ProfileSync] Insert error (attempt ${attempt + 1}):`, insertError);
                    if (attempt < MAX_RETRIES - 1) {
                        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
                        continue;
                    }
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
                                message: `New intern '${fullName || email}' just joined the platform.`,
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
                // 3. If it exists, fix missing fields + check for role promotion
                const needsRoleUpdate = user.role && existing.role !== user.role;
                const isIncomplete = !existing.full_name || existing.full_name === "New User";
                const missingAvatar = !existing.avatar_url;
                const missingUsername = !existing.username;

                if (needsRoleUpdate || isIncomplete || missingAvatar || missingUsername) {
                    console.log(`[ProfileSync] Updating profile for: ${user.id} (Role: ${needsRoleUpdate}, Incomplete: ${isIncomplete}, Avatar: ${missingAvatar}, Username: ${missingUsername})`);
                    await supabase.from("profiles").update({
                        full_name: user.full_name || existing.full_name,
                        email: user.email || existing.email,
                        avatar_url: existing.avatar_url || user.avatar_url || getFallbackAvatar(existing.full_name || user.id),
                        role: user.role || existing.role,
                        ...(missingUsername ? { username: generateUsername(existing.email, existing.full_name) } : {}),
                    }).eq("id", user.id);
                }
            }

            return { success: true };
        } catch (error: any) {
            console.error(`[ProfileSync] Unexpected error (attempt ${attempt + 1}):`, error);
            if (attempt < MAX_RETRIES - 1) {
                await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
                continue;
            }
            return { success: false, error: error.message };
        }
    }

    return { success: false, error: "Max retries exhausted" };
}
