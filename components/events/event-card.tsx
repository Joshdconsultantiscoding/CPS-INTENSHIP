"use client";

import { CalendarEvent, Profile } from "@/lib/types";
import { format } from "date-fns";
import { MapPin, Clock, Users, Calendar as CalendarIcon, MoreVertical, Trash, Edit } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { deleteEventAction } = await import("@/app/actions/calendar");
            const result = await deleteEventAction(event.id);
            if (!result.success) throw new Error(result.error);
            toast.success("Event deleted");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete event");
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsDeleting(true); // Reuse loading state or create new one
        const formData = new FormData(e.currentTarget);

        try {
            const { updateEventAction } = await import("@/app/actions/calendar");
            const result = await updateEventAction({
                id: event.id,
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                eventType: formData.get("eventType") as string,
                startTime: formData.get("startTime") as string,
                endTime: formData.get("endTime") as string,
                location: formData.get("location") as string,
                isPublic: formData.get("isPublic") === "on",
            });

            if (!result.success) throw new Error(result.error);
            toast.success("Event updated");
            setIsEditing(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to update event");
        } finally {
            setIsDeleting(false);
        }
    };

    const eventDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    return (
        <>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event "{event.title}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e: React.MouseEvent) => { e.preventDefault(); handleDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Event</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" defaultValue={event.title} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" name="description" defaultValue={event.description || ""} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    name="startTime"
                                    type="datetime-local"
                                    defaultValue={format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm")}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    name="endTime"
                                    type="datetime-local"
                                    defaultValue={event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : ""}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="eventType">Event Type</Label>
                            <select
                                name="eventType"
                                id="eventType"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                defaultValue={event.event_type}
                            >
                                <option value="meeting">Meeting</option>
                                <option value="deadline">Deadline</option>
                                <option value="review">Review</option>
                                <option value="training">Training</option>
                                <option value="assessment">Assessment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" defaultValue={event.location || ""} />
                        </div>
                        {/* Only Admin can change visibility settings usually, but let's allow creator to toggle public if they want? 
                            Strictly speaking: "intern can create events for themselves without other intern seeing".
                            So allow toggling isPublic. */}
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isPublic" name="isPublic" defaultChecked={event.is_public} className="h-4 w-4 rounded border-gray-300" />
                            <Label htmlFor="isPublic">Public Event</Label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

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
                    {/* Permission Check: Admin OR Creator */}
                    {(isCreator || isAdmin) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setShowDeleteDialog(true)}
                                >
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
        </>
    );
}
