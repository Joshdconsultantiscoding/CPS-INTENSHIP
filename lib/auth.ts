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

        // 3. Fetch Full Profile from Supabase
        let profile = null;
        try {
            const adminClient = await createAdminClient();
            const { data, error } = await adminClient
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Database error in getAuthUser:", error);
            }
            profile = data;
        } catch (dbError) {
            console.error("Supabase connection failed in getAuthUser (non-fatal):", dbError);
        }

        const email = user.emailAddresses[0]?.emailAddress || null;
        const ADMIN_EMAIL = config.adminEmail;

        // 1. Strict Override for The Admin Email (Security & Identity)
        if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            return {
                id: userId,
                email: email,
                full_name: profile?.full_name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Admin",
                avatar_url: profile?.avatar_url || user.imageUrl || null,
                role: "admin",
                firstName: profile?.first_name || user.firstName,
                lastName: profile?.last_name || user.lastName,
            };
        }

        // Default to 'intern' if no profile found
        const dbRole = profile?.role?.toLowerCase();
        const role = (dbRole === "admin") ? "admin" : "intern";

        return {
            id: userId,
            email: email,
            full_name: profile?.full_name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "User",
            avatar_url: profile?.avatar_url || user.imageUrl || null,
            role: role,
            firstName: profile?.first_name || user.firstName,
            lastName: profile?.last_name || user.lastName,
        };
    } catch (error: any) {
        // If it's a redirect error, re-throw it (standard Next.js behavior)
        if (isRedirectError(error)) throw error;

        console.error("CRITICAL ERROR in getAuthUser:", {
            message: error.message,
            stack: error.stack,
            error
        });
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
