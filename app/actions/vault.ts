"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Initialize Admin Client (Bypasses RLS for checking codes)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export async function verifyVaultCode(code: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, message: "Unauthorized" };
    }

    const email = user.emailAddresses[0]?.emailAddress;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "agbojoshua2005@gmail.com";

    // Double-Check Email Identity
    if (email !== ADMIN_EMAIL) {
        await logAudit(email || "unknown", "BREACH_ATTEMPT_WRONG_EMAIL", { code });
        return { success: false, message: "Identity Verification Failed" };
    }

    // Check Code in DB
    const { data: codeRecord, error } = await supabaseAdmin
        .from("admin_access_codes")
        .select("*")
        .eq("code", code)
        .single();

    if (error || !codeRecord) {
        await logAudit(email, "INVALID_CODE_ATTEMPT", { code });
        return { success: false, message: "Invalid Access Code" };
    }

    if (codeRecord.is_used) {
        await logAudit(email, "USED_CODE_ATTEMPT", { code });
        return { success: false, message: "Code Already Used" };
    }

    // Mark as Used
    const { error: updateError } = await supabaseAdmin
        .from("admin_access_codes")
        .update({
            is_used: true,
            used_at: new Date().toISOString(),
            used_by_email: email
        })
        .eq("id", codeRecord.id);

    if (updateError) {
        return { success: false, message: "Database Error" };
    }

    // Log Success
    await logAudit(email, "VAULT_ACCESS_GRANTED", { codeId: codeRecord.id });

    // Set Vault Session Cookie
    (await cookies()).set("admin_vault_session", "unlocked", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
    });

    return { success: true };
}

async function logAudit(email: string, action: string, details: any) {
    try {
        const { headers } = await import("next/headers");
        const ip = (await headers()).get("x-forwarded-for") || "unknown";

        await supabaseAdmin.from("admin_audit_logs").insert({
            action,
            user_email: email,
            details,
            ip_address: ip
        });
    } catch (e) {
        console.error("Audit Log Failure", e);
    }
}
