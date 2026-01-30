import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TaskCreationPage } from "@/components/tasks/task-creation-page";

export const metadata = {
    title: "Create Task",
};

export default async function NewTaskPage() {
    const user = await getAuthUser();
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Only admins can create tasks
    if (profile?.role !== "admin") {
        redirect("/dashboard/tasks");
    }

    // Get interns list
    const { data: interns } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "intern")
        .eq("status", "active")
        .order("full_name", { ascending: true });

    return <TaskCreationPage userId={user.id} interns={interns || []} />;
}
