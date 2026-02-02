"use client";

import { CalendarEvent, Profile } from "@/lib/types";
import { format } from "date-fns";
import { MapPin, Clock, Users, Calendar as CalendarIcon, MoreVertical, Trash, Edit } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EventCardProps {
    event: CalendarEvent & {
        creator?: {
            full_name: string;
            avatar_url: string;
        }
    };
    currentUserId: string;
    isAdmin: boolean;
}

const eventTypeColors: Record<string, string> = {
    meeting: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    deadline: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    review: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    training: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function EventCard({ event, currentUserId, isAdmin }: EventCardProps) {
    const isCreator = event.user_id === currentUserId;
    // Actually, in our schema fix we renamed it to user_id.
    // But types.ts says created_by. We should align.
    // For now, let's assume the fetch returns it as user_id aliased or we fix types.
    // Wait, the page.tsx fetch is `select("*")`. DB has `user_id`. Type has `created_by`.
    // This will cause a mismatch. I should fix types.ts to have `user_id` or alias in query.
    // Let's use `user_id in type` or check logic.
    // I previously updated types.ts to keep created_by ? No, existing was created_by.
    // Schema was creating user_id.
    // I should update types.ts to `user_id`.

    const eventDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold line-clamp-1">
                        {event.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className={eventTypeColors[event.event_type] || eventTypeColors.other}>
                            {event.event_type}
                        </Badge>
                        {event.is_public && (
                            <Badge variant="secondary" className="text-xs">
                                Public
                            </Badge>
                        )}
                    </CardDescription>
                </div>
                {(isCreator || isAdmin) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                        {format(eventDate, "PPP")}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                        {format(eventDate, "p")} - {format(endDate, "p")}
                    </span>
                </div>
                {event.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                    </div>
                )}
                <div className="line-clamp-2 mt-2 text-muted-foreground">
                    {event.description}
                </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={event.creator?.avatar_url} />
                        <AvatarFallback>
                            {event.creator?.full_name?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <span>Created by {event.creator?.full_name || "Unknown"}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
