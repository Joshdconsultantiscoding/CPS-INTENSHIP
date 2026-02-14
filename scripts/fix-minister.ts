import { createAdminClient } from "../lib/supabase/server";

async function findAndUnsuspend() {
    const supabase = await createAdminClient();

    // Find User
    const { data: users, error: findError } = await supabase
        .from("profiles")
        .select("id, full_name, email, account_status")
        .ilike("full_name", "%Minister%");

    if (findError) {
        console.error("Error finding user:", findError);
        return;
    }

    if (!users || users.length === 0) {
        console.log("No user found with name containing 'Minister'");
        return;
    }

    const user = users[0];
    console.log(`Found User: ${user.full_name} (${user.id}) - Status: ${user.account_status}`);

    // Unsuspend
    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            account_status: "active",
            suspended_at: null,
            suspended_reason: null
        })
        .eq("id", user.id);

    if (updateError) {
        console.error("Error updating status:", updateError);
        return;
    }
    console.log("Updated account_status to active.");

    // Delete Notifications
    const { error: delError } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("priority_level", "CRITICAL")
        .eq("title", "Account Suspended");

    if (delError) {
        console.error("Error deleting notifications:", delError);
    } else {
        console.log("Deleted all 'Account Suspended' notifications for user.");
    }
}

findAndUnsuspend();
