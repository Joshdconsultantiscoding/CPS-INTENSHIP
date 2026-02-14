"use server";

import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveDocumentDraft(data: {
    field: "learning_plan_url" | "expectation_plan_url" | "earning_plan_url" | "internship_plan_url";
    url: string;
}) {
    const user = await getAuthUser();
    const supabase = await createAdminClient();

    const timestampField = data.field.replace("_url", "_submitted_at");

    const { error } = await supabase
        .from("intern_documents")
        .upsert({
            intern_id: user.id,
            [data.field]: data.url,
            [timestampField]: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: "intern_id" });

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/intern/complete-documents");
    return { success: true };
}

export async function submitAllDocuments() {
    const user = await getAuthUser();
    const supabase = await createAdminClient();

    // 1. Fetch current record
    const { data: record, error: fetchError } = await supabase
        .from("intern_documents")
        .select("*")
        .eq("intern_id", user.id)
        .single();

    if (fetchError || !record) {
        throw new Error("No document record found. Please upload all files first.");
    }

    // 2. Validate all 4 are present
    const requiredFiles = [
        "learning_plan_url",
        "expectation_plan_url",
        "earning_plan_url",
        "internship_plan_url"
    ];

    const missing = requiredFiles.filter(f => !record[f]);
    if (missing.length > 0) {
        throw new Error(`Please upload all 4 required documents. Missing: ${missing.length}`);
    }

    // 3. Update status to complete
    const { error: updateDocError } = await supabase
        .from("intern_documents")
        .update({
            submission_status: "complete",
            updated_at: new Date().toISOString()
        })
        .eq("intern_id", user.id);

    if (updateDocError) throw new Error(updateDocError.message);

    // 4. Update profile flag
    const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ documents_completed: true })
        .eq("id", user.id);

    if (updateProfileError) throw new Error(updateProfileError.message);

    // 5. Trigger AI Indexing in background (Non-blocking)
    // We'll call the analyze API or a specialized indexing internal function
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        // Fire and forget indexing trigger
        fetch(`${baseUrl}/api/ai/documents/index-intern`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ internId: user.id }),
        }).catch(err => console.error("Background indexing trigger failed:", err));
    } catch (e) {
        console.warn("Could not trigger background indexing:", e);
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function getInternDocumentsStatus() {
    const user = await getAuthUser();
    const supabase = await createAdminClient();

    const { data, error } = await supabase
        .from("intern_documents")
        .select("*")
        .eq("intern_id", user.id)
        .maybeSingle();

    if (error && error.code !== "PGRST116") throw new Error(error.message);

    return data || {
        learning_plan_url: null,
        expectation_plan_url: null,
        earning_plan_url: null,
        internship_plan_url: null,
        submission_status: "incomplete"
    };
}
