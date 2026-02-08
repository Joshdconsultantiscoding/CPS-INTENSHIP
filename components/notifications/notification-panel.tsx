"use client";

import React, { useState } from "react";
import { useNotifications } from "./notification-engine";
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

interface NotificationPanelProps {
    onClose?: () => void;
    className?: string;
    hideHeaderCloseButton?: boolean;
    isMobile?: boolean;
}

export function NotificationPanel({ onClose, className, hideHeaderCloseButton, isMobile }: NotificationPanelProps) {
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
        <div className={cn("flex flex-col w-full bg-background overflow-hidden", isMobile ? "h-full" : "max-h-[600px]", className)}>
            <div className="flex items-center justify-between p-4 border-b shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">Notifications</h3>
                    {unreadCount > 0 && (
                        <Badge variant="secondary" className="rounded-full px-2 py-0.5 font-bold">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 px-2"
                            onClick={() => markAllAsRead()}
                            title="Mark all as read"
                        >
                            <Check className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:ml-1">Mark all read</span>
                        </Button>
                    )}
                    {onClose && !hideHeaderCloseButton && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="px-4 py-3 border-b bg-muted/30 shrink-0 space-y-3">
                {permissionStatus === 'default' && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Bell className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold leading-none">Enable Push Notifications</p>
                                <p className="text-[10px] text-muted-foreground">Get real-time updates instantly.</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="h-7 px-3 text-[10px] rounded-lg font-bold"
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
                    <div className="flex gap-2 pb-1">
                        {[
                            { id: "all", label: "All Updates" },
                            { id: "unread", label: "Unread" },
                            { id: "tasks", label: "Tasks" },
                            { id: "rewards", label: "Rewards" },
                            { id: "reports", label: "Reports" },
                        ].map((btn) => (
                            <Button
                                key={btn.id}
                                variant={filter === btn.id ? "secondary" : "ghost"}
                                size="sm"
                                className={cn(
                                    "h-8 text-xs rounded-full font-medium transition-all",
                                    filter === btn.id ? "bg-secondary hover:bg-secondary/80" : "bg-transparent hover:bg-muted"
                                )}
                                onClick={() => setFilter(btn.id)}
                            >
                                {btn.label}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            <ScrollArea className={cn("flex-1", !isMobile && "h-[400px]")}>
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-[300px]">
                        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Bell className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h4 className="text-base font-semibold">No notifications</h4>
                        <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                            You're all caught up! We'll alert you when there's something new.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 transition-all hover:bg-muted/40 group flex gap-4 relative",
                                    !notification.is_read && "bg-primary/3"
                                )}
                            >
                                <div className="mt-1 shrink-0">
                                    <div className={cn(
                                        "h-9 w-9 rounded-full flex items-center justify-center border shadow-sm",
                                        !notification.is_read ? "bg-background border-primary/20" : "bg-muted/30 border-transparent"
                                    )}>
                                        {getIcon(notification.notification_type)}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className={cn(
                                            "text-sm leading-snug font-semibold",
                                            !notification.is_read ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {notification.message}
                                    </p>

                                    <div className="flex items-center justify-between pt-1">
                                        {notification.link ? (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                asChild
                                                className="p-0 h-auto text-xs text-primary font-medium hover:underline"
                                            >
                                                <Link href={notification.link} onClick={onClose}>
                                                    View Details
                                                    <ExternalLink className="h-3 w-3 ml-1" />
                                                </Link>
                                            </Button>
                                        ) : <div />}

                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-background hover:shadow-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                            >
                                                <Check className="h-3 w-3 mr-1" />
                                                Mark read
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {!notification.is_read && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-3 border-t bg-muted/20 text-center shrink-0">
                <Button variant="link" size="sm" className="text-xs text-muted-foreground hover:text-foreground" asChild>
                    <Link href="/dashboard/notifications" onClick={onClose}>
                        View all notification history
                    </Link>
                </Button>
            </div>
        </div>
    );
}
