import { Metadata } from "next";
import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = {
  title: "Calendar",
};

export default async function CalendarPage() {
  // Use Clerk auth
  const user = await getAuthUser();
  const supabase = await createAdminClient();

  const isAdmin = user.role === "admin";

  // Fetch events using Service Role (bypassing RLS issues with Clerk)
  // We manually filter by user permissions here
  let eventsQuery = supabase
    .from("calendar_events")
    .select("*")
    .order("start_time", { ascending: true });

  if (!isAdmin) {
    eventsQuery = eventsQuery.or(`user_id.eq.${user.id},is_public.eq.true`);
  }

  const { data: events } = await eventsQuery;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your schedule and events
          </p>
        </div>
      </div>
      <CalendarView events={events || []} userId={user.id} isAdmin={isAdmin} />
    </div>
  );
}
