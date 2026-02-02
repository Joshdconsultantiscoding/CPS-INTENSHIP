"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, X, Bot, Sparkles, Hash } from "lucide-react";
import type { Channel, Message, Profile } from "@/lib/types";
import { OnlineIndicator } from "./online-indicator";

interface Conversation {
    user: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
        role: string;
        online_status?: string;
        last_seen_at?: string | null;
    };
    lastMessage: Message;
    unread: number;
}

interface ListViewProps {
    currentUser: any;
    users: any[];
    channels: Channel[];
    conversations: Conversation[];
    showSearch: boolean;
    searchQuery: string;
    onToggleSearch: () => void;
    onSearchChange: (value: string) => void;
    onOpenChat: (type: "ai" | "user" | "channel", item?: any) => void;
    getInitials: (profile: any) => string;
    formatTime: (date: Date | string) => string;
    getStatus: (id: string) => string;
}

export function ListView({
    currentUser,
    users,
    channels,
    conversations,
    showSearch,
    searchQuery,
    onToggleSearch,
    onSearchChange,
    onOpenChat,
    getInitials,
    formatTime,
    getStatus,
}: ListViewProps) {
    const filtered = users.filter(
        (u) =>
            u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
                <div className="flex items-center justify-between p-4 px-5">
                    <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                    <Button variant="ghost" size="icon" onClick={onToggleSearch} className="rounded-full hover:bg-muted/80">
                        {showSearch ? (
                            <X className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <Search className="h-5 w-5 text-muted-foreground" />
                        )}
                    </Button>
                </div>
                {showSearch && (
                    <div className="px-4 pb-3">
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="h-10"
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
                {/* AI Assistant */}
                <button
                    onClick={() => onOpenChat("ai")}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/40 active:bg-muted/60 transition-all border-b group"
                >
                    <div className="relative shrink-0 transition-transform group-hover:scale-105">
                        <Avatar className="h-14 w-14 bg-linear-to-tr from-primary via-primary/80 to-primary/60 shadow-md">
                            <AvatarFallback className="bg-transparent text-white">
                                <Bot className="h-7 w-7" />
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-[3px] border-background shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-base">HG Core</span>
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-primary/10 text-primary border-none">
                                <Sparkles className="h-3 w-3 mr-0.5" /> AI
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground/80 font-medium truncate">
                            Your personal assistant
                        </p>
                    </div>
                </button>

                {/* Channels */}
                {channels.length > 0 && (
                    <>
                        <div className="px-5 py-2.5 bg-muted/20">
                            <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                                Channels
                            </span>
                        </div>
                        {channels.map((channel) => (
                            <button
                                key={channel.id}
                                onClick={() => onOpenChat("channel", channel)}
                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/40 active:bg-muted/60 transition-all border-b last:border-none group"
                            >
                                <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 group-hover:bg-primary/5">
                                    <Hash className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="font-bold text-base group-hover:text-primary transition-colors">{channel.name}</p>
                                    <p className="text-sm text-muted-foreground/80 font-medium truncate">
                                        {channel.description || "Active community"}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </>
                )}

                {/* Direct Messages */}
                <div className="px-5 py-2.5 bg-muted/20">
                    <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                        Direct Messages
                    </span>
                </div>

                {conversations.map((conv) => (
                    <button
                        key={conv.user.id}
                        onClick={() => onOpenChat("user", conv.user)}
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/40 active:bg-muted/60 transition-all border-b last:border-none group"
                    >
                        <div className="relative shrink-0 transition-transform group-hover:scale-105">
                            <Avatar className="h-14 w-14 shadow-sm">
                                <AvatarImage src={conv.user.avatar_url || ""} />
                                <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                                    {conv.user.first_name?.[0] || conv.user.full_name?.[0] || conv.user.email[0].toUpperCase()}
                                    {conv.user.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <OnlineIndicator status={getStatus(conv.user.id)} size="lg" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="font-bold text-base truncate group-hover:text-primary transition-colors">
                                    {conv.user.first_name || conv.user.last_name
                                        ? `${conv.user.first_name || ""} ${conv.user.last_name || ""}`.trim()
                                        : conv.user.full_name || conv.user.email}
                                </span>
                                <span className="text-[11px] font-bold text-muted-foreground/60 shrink-0 uppercase">
                                    {formatTime(
                                        conv.lastMessage?.created_at || new Date().toISOString()
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-muted-foreground/80 font-medium truncate">
                                    {conv.lastMessage?.content?.startsWith("[CALL_LOG]:")
                                        ? (() => {
                                            const parts = conv.lastMessage.content.split(":");
                                            const type = parts[1];
                                            const isMissed = parts[2] === "missed";
                                            return isMissed ? `Missed ${type} call` : `${type.charAt(0).toUpperCase() + type.slice(1)} call`;
                                        })()
                                        : (conv.lastMessage?.content || "No messages yet")}
                                </p>
                                {conv.unread > 0 && (
                                    <Badge className="h-5 min-w-5 justify-center rounded-full shrink-0 border-none bg-primary font-bold text-[10px]">
                                        {conv.unread}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </button>
                ))}

                {/* Other users */}
                {filtered
                    .filter(
                        (u) =>
                            !conversations.some((c) => c.user.id === u.id) &&
                            u.id !== currentUser.id
                    )
                    .map((user) => (
                        <button
                            key={user.id}
                            onClick={() => onOpenChat("user", user)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors"
                        >
                            <div className="relative shrink-0">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.avatar_url || ""} />
                                    <AvatarFallback>
                                        {user.first_name?.[0] || user.full_name?.[0] || user.email[0].toUpperCase()}
                                        {user.last_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <OnlineIndicator status={getStatus(user.id)} size="md" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="font-medium truncate">
                                    {user.first_name || user.last_name
                                        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                        : user.full_name || user.email}
                                </p>
                                <p className="text-sm text-muted-foreground capitalize">
                                    {user.role}
                                </p>
                            </div>
                        </button>
                    ))}
            </div>
        </div>
    );
}
