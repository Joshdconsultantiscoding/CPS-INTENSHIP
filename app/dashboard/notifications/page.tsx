import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  // Use Clerk auth
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated on tasks, reports, and messages
        </p>
      </div>

      <NotificationList notifications={notifications || []} userId={user.id} />
    </div>
  );
}
