import { Metadata } from "next";
import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { EventsList } from "@/components/events/events-list";

export const metadata: Metadata = {
    title: "Events",
};

export default async function EventsPage() {
    const user = await getAuthUser();
    const supabase = await createAdminClient();
    const isAdmin = user.role === "admin";

    // Fetch events with creator profiles
    let eventsQuery = supabase
        .from("calendar_events")
        .select(`
            *,
            creator:profiles!calendar_events_user_id_fkey(full_name, avatar_url)
        `)
        .order("start_time", { ascending: true });

    if (!isAdmin) {
        // Interns see public events OR their own events OR events assigned to them
        eventsQuery = eventsQuery.or(`user_id.eq.${user.id},is_public.eq.true,attendees.cs.{${user.id}}`);
    }

    const { data: events, error } = await eventsQuery;

    if (error) {
        console.error("Error fetching events:", error);
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Events</h1>
                    <p className="text-muted-foreground">
                        Discover workshops, meetings, and important deadlines.
                    </p>
                </div>
            </div>

            <EventsList
                initialEvents={events || []}
                currentUserId={user.id}
                isAdmin={isAdmin}
            />
        </div>
    );
}
