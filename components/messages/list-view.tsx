"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, X, Bot, Sparkles, Hash } from "lucide-react";
import type { Channel, Message, Profile } from "@/lib/types";
import { motion } from "framer-motion";
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
    typingUsers?: Map<string, { targetUserId: string; timestamp: number }>;
    recordingUsers?: Map<string, { targetUserId: string; timestamp: number }>;
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
    typingUsers,
    recordingUsers,
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
            <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
                <>
                    {/* AI Assistant */}
                    <motion.button
                        key="ai-assistant-chat"
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => onOpenChat("ai")}
                        className="w-full flex items-center gap-4 px-4 py-3 mb-2 rounded-xl hover:bg-muted/40 transition-all border border-transparent hover:border-border/40 group relative overflow-hidden"
                    >
                        <div className="relative shrink-0 transition-transform group-hover:scale-105 z-10">
                            <Avatar className="h-12 w-12 bg-linear-to-tr from-primary via-purple-500 to-pink-500 shadow-lg ring-2 ring-background">
                                <AvatarFallback className="bg-transparent text-white">
                                    <Bot className="h-6 w-6" />
                                </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background shadow-xs" />
                        </div>
                        <div className="flex-1 min-w-0 text-left z-10">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-bold text-sm">HG Core</span>
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] font-bold bg-primary/10 text-primary border-none">
                                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground/80 font-medium truncate">
                                Your personal assistant
                            </p>
                        </div>
                        {/* Hover Gradient */}
                        <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>

                    {/* Recent Conversations */}
                    {conversations.length > 0 && !searchQuery && (
                        <div key="recent-conversations-section" className="mb-6">
                            <h2 className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Recent</h2>
                            <div className="space-y-1">
                                {conversations.map((conv, idx) => (
                                    <motion.button
                                        key={`conv-${conv.user.id || `idx-${idx}`}`}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => onOpenChat("user", conv.user)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/40 transition-all group border border-transparent hover:border-border/20"
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar className="h-12 w-12 border">
                                                <AvatarImage src={conv.user.avatar_url || ""} />
                                                <AvatarFallback>{getInitials(conv.user)}</AvatarFallback>
                                            </Avatar>
                                            <OnlineIndicator
                                                status={getStatus(conv.user.id)}
                                                size="sm"
                                                className="absolute bottom-0 right-0 ring-2 ring-background"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <span className="font-bold text-sm truncate">
                                                    {conv.user.full_name || conv.user.email}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                    {formatTime(conv.lastMessage.created_at)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 min-h-[16px]">
                                                {typingUsers?.has(conv.user.id) && typingUsers.get(conv.user.id)?.targetUserId === currentUser.id ? (
                                                    <span className="text-xs text-green-500 font-bold animate-pulse">typing...</span>
                                                ) : recordingUsers?.has(conv.user.id) && recordingUsers.get(conv.user.id)?.targetUserId === currentUser.id ? (
                                                    <span className="text-xs text-red-500 font-bold animate-pulse">recording...</span>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground truncate opacity-80">
                                                        {conv.lastMessage.sender_id === currentUser.id && "You: "}
                                                        {conv.lastMessage.content || (conv.lastMessage.attachments?.length ? "Sent an attachment" : "")}
                                                    </p>
                                                )}
                                                {conv.unread > 0 && (
                                                    <Badge className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] bg-primary">
                                                        {conv.unread}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Communities / Channels */}
                    {channels.length > 0 && !searchQuery && (
                        <div key="channels-section" className="mb-6">
                            <h2 className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Communities</h2>
                            <div className="space-y-1">
                                {channels.map((channel) => (
                                    <motion.button
                                        key={`channel-${channel.id}`}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => onOpenChat("channel", channel)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/40 transition-all group border border-transparent hover:border-border/20"
                                    >
                                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-border/40">
                                            <Hash className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <h3 className="font-bold text-sm truncate">{channel.name}</h3>
                                            <p className="text-xs text-muted-foreground truncate opacity-70">
                                                {channel.description || "Community channel"}
                                            </p>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Users / Search Results */}
                    <div key="all-contacts-section">
                        <h2 className="px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
                            {searchQuery ? "Search Results" : "All Contacts"}
                        </h2>
                        <div className="space-y-1">
                            {filtered.length > 0 ? (
                                filtered.map((u, idx) => (
                                    <motion.button
                                        key={`user-${u.id || `idx-${idx}`}`}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => onOpenChat("user", u)}
                                        className="w-full flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-muted/40 transition-all group border border-transparent hover:border-border/20"
                                    >
                                        <div className="relative shrink-0 scale-90 origin-left">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src={u.avatar_url || ""} />
                                                <AvatarFallback>{getInitials(u)}</AvatarFallback>
                                            </Avatar>
                                            <OnlineIndicator
                                                status={getStatus(u.id)}
                                                size="sm"
                                                className="absolute bottom-0 right-0 ring-2 ring-background"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <h3 className="font-bold text-sm truncate">{u.full_name || u.email}</h3>
                                            <p className="text-[10px] text-muted-foreground truncate opacity-60">
                                                {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Member"}
                                            </p>
                                        </div>
                                    </motion.button>
                                ))
                            ) : (
                                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    No contacts found
                                </p>
                            )}
                        </div>
                    </div>
                </>
            </div>
        </div>
    );
}
