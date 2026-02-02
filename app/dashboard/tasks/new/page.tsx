import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TaskCreationPage } from "@/components/tasks/task-creation-page";

export const metadata = {
    title: "Create Task",
};

export default async function NewTaskPage() {
    try {
        const user = await getAuthUser();
        console.log("[New Task Page] Authenticated user:", { id: user.id, email: user.email, role: user.role });

        // Only admins can create tasks
        if (user.role !== "admin") {
            console.warn("[New Task Page] Non-admin user attempted to access:", user.email);
            redirect("/dashboard/tasks");
        }

        const supabase = await createClient();

        // Get interns list with better error handling
        const { data: interns, error: internsError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("role", "intern")
            .eq("status", "active")
            .order("full_name", { ascending: true });

        if (internsError) {
            console.error("[New Task Page] Error fetching interns:", internsError);
        }

        console.log("[New Task Page] Found interns:", interns?.length || 0);

        return <TaskCreationPage userId={user.id} interns={interns || []} />;
    } catch (error) {
        console.error("[New Task Page] Critical error:", error);
        // Re-throw redirect errors
        if (error && typeof error === 'object' && 'digest' in error) {
            throw error;
        }
        // For other errors, redirect to tasks page
        redirect("/dashboard/tasks");
    }
}
