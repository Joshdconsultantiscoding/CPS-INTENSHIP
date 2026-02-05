"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, X, Bot, Sparkles, Hash } from "lucide-react";
import type { Channel, Message, Profile } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
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
                <AnimatePresence>
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

                    {/* Coming Soon Section */}
                    <motion.div
                        key="peer-messaging-coming-soon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 px-4"
                    >
                        <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-6 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-1">Peer Messaging</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Direct messaging with other interns is coming soon! For now, please use the AI Assistant for support.
                            </p>
                            <div className="flex justify-center gap-1 text-xs text-muted-foreground/60">
                                <span className="px-2 py-1 rounded-md bg-background border">Group Chats</span>
                                <span className="px-2 py-1 rounded-md bg-background border">File Sharing</span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
