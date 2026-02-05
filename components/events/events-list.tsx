"use client";

import { CalendarEvent, Profile } from "@/lib/types";
import { EventCard } from "./event-card";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { isAfter, isBefore, isSameDay } from "date-fns";

interface EventsListProps {
    initialEvents: (CalendarEvent & {
        creator?: {
            full_name: string;
            avatar_url: string;
        }
    })[];
    currentUserId: string;
    isAdmin: boolean;
}

type FilterType = "upcoming" | "past" | "mine" | "training" | "all";

export function EventsList({ initialEvents, currentUserId, isAdmin }: EventsListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<FilterType>("upcoming");
    const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

    const filteredEvents = initialEvents.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesFilter = true;
        const now = new Date();
        const eventDate = new Date(event.start_time);

        switch (filter) {
            case "upcoming":
                matchesFilter = isAfter(eventDate, now) || isSameDay(eventDate, now);
                break;
            case "past":
                matchesFilter = isBefore(eventDate, now) && !isSameDay(eventDate, now);
                break;
            case "mine":
                matchesFilter = event.user_id === currentUserId || (event.attendees && event.attendees.includes(currentUserId));
                break;
            case "training":
                matchesFilter = event.event_type === "training";
                break;
            case "all":
            default:
                matchesFilter = true;
        }

        let matchesType = true;
        if (eventTypeFilter !== "all") {
            matchesType = event.event_type === eventTypeFilter;
        }

        return matchesSearch && matchesFilter && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <Button
                        variant={filter === "upcoming" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("upcoming")}
                    >
                        Upcoming
                    </Button>
                    <Button
                        variant={filter === "mine" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("mine")}
                    >
                        My Events
                    </Button>
                    <Button
                        variant={filter === "past" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("past")}
                    >
                        Past
                    </Button>
                    <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                        <SelectTrigger className="w-[140px] h-9">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Type" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="deadline">Deadline</SelectItem>
                            <SelectItem value="training">Training</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredEvents.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">No events found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEvents.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
