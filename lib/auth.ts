import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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
 * Get the authenticated user from Clerk.
 * Use this instead of supabase.auth.getUser() in all dashboard pages.
 * Redirects to sign-in if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser> {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    return {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || null,
        full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "User",
        avatar_url: user.imageUrl || null,
        role: "admin", // You are the sole admin
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
        role: "admin",
        firstName: user.firstName,
        lastName: user.lastName,
    };
}
