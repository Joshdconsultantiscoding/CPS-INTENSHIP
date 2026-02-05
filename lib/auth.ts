import { auth, currentUser } from "@clerk/nextjs/server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";
import { cache } from "react";

export interface AuthUser {
    id: string;
    email: string | null;
    full_name: string;
    avatar_url: string | null;
    role: "admin" | "intern";
    firstName: string | null;
    lastName: string | null;
}

/**
 * Get the authenticated user from Clerk with Role from Supabase.
 * Use this in all dashboard pages.
 * Redirects to sign-in if not authenticated.
 */
export const getAuthUser = cache(async (): Promise<AuthUser> => {
    const { userId } = await auth();

    if (!userId) {
        redirect("/auth/sign-in");
    }

    // 2. Fetch User first to ensure we have a valid session before DB call
    try {
        const user = await currentUser();

        if (!user) {
            console.warn("Clerk user not found for ID:", userId);
            redirect("/auth/sign-in");
        }

        // 3. Fetch Role from Supabase (sperately to avoid Promise.all swallowing redirects)
        let profile = null;
        try {
            const adminClient = await createAdminClient();
            const { data, error } = await adminClient
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Database error in getAuthUser:", error);
            }
            profile = data;
        } catch (dbError) {
            console.error("Supabase connection failed in getAuthUser (non-fatal):", dbError);
            // Verify if we should block access or default to intern. 
            // For now, default to intern to allow access if DB is flaky.
        }

        const email = user.emailAddresses[0]?.emailAddress || null;
        const ADMIN_EMAIL = config.adminEmail;

        // 1. Strict Override for The Admin Email (Security & Identity)
        if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            return {
                id: userId,
                email: email,
                full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Admin",
                avatar_url: user.imageUrl || null,
                role: "admin",
                firstName: user.firstName,
                lastName: user.lastName,
            };
        }


        // Default to 'intern' if no profile found
        const dbRole = profile?.role?.toLowerCase();
        const role = (dbRole === "admin") ? "admin" : "intern";

        return {
            id: userId,
            email: email,
            full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "User",
            avatar_url: user.imageUrl || null,
            role: role,
            firstName: user.firstName,
            lastName: user.lastName,
        };
    } catch (error: any) {
        // If it's a redirect error, re-throw it (standard Next.js behavior)
        if (isRedirectError(error)) throw error;

        console.error("CRITICAL ERROR in getAuthUser:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Authentication failure: ${errorMessage || "Unknown error"}`);
    }
});

/**
 * Check if user is authenticated without redirecting.
 * Returns null if not authenticated.
 */
export const getAuthUserOptional = cache(async (): Promise<AuthUser | null> => {
    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    const user = await currentUser();

    if (!user) {
        return null;
    }

    return {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || null,
        full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "User",
        avatar_url: user.imageUrl || null,
        role: "intern",
        firstName: user.firstName,
        lastName: user.lastName,
    };
});
