"use client";

import { CalendarEvent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isSameDay } from "date-fns";
import { CalendarDays, Clock, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EventsWidgetProps {
    events: CalendarEvent[];
}

export function EventsWidget({ events }: EventsWidgetProps) {
    // Filter for upcoming events only (already filtered by query ideally, but double check)
    const upcomingEvents = events
        .filter(e => new Date(e.start_time) >= new Date())
        .slice(0, 3);

    return (
        <Card className="col-span-full lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Upcoming Events
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-xs">
                    <Link href="/dashboard/events">
                        View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {upcomingEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                        <CalendarDays className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">No upcoming events scheduled.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-start gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                            >
                                <div className="flex flex-col items-center justify-center rounded-md border bg-background p-2 w-14 h-14 shrink-0">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                        {format(new Date(event.start_time), "MMM")}
                                    </span>
                                    <span className="text-lg font-bold text-primary">
                                        {format(new Date(event.start_time), "d")}
                                    </span>
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-sm truncate">{event.title}</p>
                                        {event.event_type === "deadline" && (
                                            <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Deadline</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(event.start_time), "h:mm a")}
                                        </span>
                                        {event.location && (
                                            <span className="flex items-center gap-1 truncate max-w-[100px]">
                                                <MapPin className="h-3 w-3" />
                                                {event.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
