import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
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

    const user = await currentUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const email = user.emailAddresses[0]?.emailAddress || null;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "agbojoshua2005@gmail.com";

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

    // 2. Fetch Role from Supabase for everyone else
    // We use createAdminClient to bypass RLS, ensuring we can always read the user's role
    // This is safe because we have already verified the userId via Clerk
    const supabase = await createAdminClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

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
