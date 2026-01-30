import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
export async function getAuthUser(): Promise<AuthUser> {
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
    if (email === ADMIN_EMAIL) {
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
    const supabase = await createClient();

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
}

/**
 * Check if user is authenticated without redirecting.
 * Returns null if not authenticated.
 */
export async function getAuthUserOptional(): Promise<AuthUser | null> {
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
}
