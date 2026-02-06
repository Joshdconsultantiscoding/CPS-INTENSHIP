"use client";

import React, { useState } from "react";
import { useNotifications } from "./notification-provider";
import { NotificationType } from "@/lib/notifications/notification-types";
import { formatDistanceToNow } from "date-fns";
import {
    Bell,
    Check,
    Trash2,
    Clock,
    ExternalLink,
    AlertTriangle,
    CheckCircle2,
    Info,
    Award,
    BookOpen,
    MessageCircle,
    X,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NotificationPanel({ onClose }: { onClose?: () => void }) {
    const { notifications, markAsRead, markAllAsRead, unreadCount, permissionStatus, requestPermission } = useNotifications();
    const [filter, setFilter] = useState<string>("all");

    const filteredNotifications = notifications.filter(n => {
        if (filter === "all") return true;
        if (filter === "unread") return !n.is_read;
        if (filter === "tasks") return n.notification_type === 'task' || n.notification_type === 'deadline';
        if (filter === "rewards") return n.notification_type === 'reward' || n.notification_type === 'achievement';
        if (filter === "reports") return n.notification_type === 'report';
        return true;
    });

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success':
            case 'reward':
            case 'achievement':
                return <Award className="h-4 w-4 text-yellow-500" />;
            case 'warning':
            case 'deadline':
                return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case 'error':
                return <X className="h-4 w-4 text-red-500" />;
            case 'task':
            case 'class':
                return <BookOpen className="h-4 w-4 text-blue-500" />;
            case 'message':
                return <MessageCircle className="h-4 w-4 text-green-500" />;
            case 'report':
                return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
            default:
                return <Info className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[600px] w-full min-w-[320px] md:min-w-[400px]">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold tracking-tight">Notifications</h3>
                    {unreadCount > 0 && (
                        <Badge variant="secondary" className="rounded-full px-1.5 py-0.5">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => markAllAsRead()}
                        >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Mark all as read
                        </Button>
                    )}
                    {onClose && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="px-4 py-2 border-b bg-muted/50">
                <div className="flex flex-col gap-2">
                    {permissionStatus === 'default' && (
                        <div className="flex items-center justify-between p-2 mb-1 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Bell className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold leading-none">Enable Browser Alerts</p>
                                    <p className="text-[9px] text-muted-foreground line-clamp-1">Stay updated even when you're busy.</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    requestPermission();
                                }}
                            >
                                Enable
                            </Button>
                        </div>
                    )}
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex gap-2 pb-2">
                            {[
                                { id: "all", label: "All" },
                                { id: "unread", label: "Unread" },
                                { id: "tasks", label: "Tasks" },
                                { id: "rewards", label: "Rewards" },
                                { id: "reports", label: "Reports" },
                            ].map((btn) => (
                                <Button
                                    key={btn.id}
                                    variant={filter === btn.id ? "secondary" : "ghost"}
                                    size="sm"
                                    className="h-7 text-xs rounded-full"
                                    onClick={() => setFilter(btn.id)}
                                >
                                    {btn.label}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <ScrollArea className="flex-1">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Bell className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium">No notifications yet</p>
                        <p className="text-xs text-muted-foreground">We'll alert you when something happens.</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 transition-colors hover:bg-muted/50 group flex gap-3",
                                    !notification.is_read && "bg-primary/5"
                                )}
                            >
                                <div className="mt-1">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center border",
                                        !notification.is_read ? "bg-background border-primary/20" : "bg-muted/30 border-transparent"
                                    )}>
                                        {getIcon(notification.notification_type)}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className={cn(
                                            "text-sm leading-tight truncate font-semibold",
                                            !notification.is_read ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-2">
                                            {notification.link && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    asChild
                                                    className="p-0 h-auto text-xs text-primary font-medium"
                                                >
                                                    <Link href={notification.link} onClick={onClose}>
                                                        View Details
                                                        <ExternalLink className="h-3 w-3 ml-1" />
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <Check className="h-3 w-3 mr-1" />
                                                Mark as read
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {!notification.is_read && (
                                    <div className="flex flex-col justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-3 border-t bg-muted/20 text-center">
                <Button variant="link" size="sm" className="text-xs text-muted-foreground" asChild>
                    <Link href="/dashboard/notifications" onClick={onClose}>
                        View all notification history
                    </Link>
                </Button>
            </div>
        </div>
    );
}
