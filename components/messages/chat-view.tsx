"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Send,
    ArrowLeft,
    Phone,
    Video,
    MoreVertical,
    Bot,
    Sparkles,
    Hash,
    Check,
    CheckCheck,
    Clock,
    Paperclip,
    FileIcon,
    ImageIcon,
    Mic,
    Camera,
    Headphones,
    FileText,
    User as UserIcon,
    BarChart2,
    Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, Channel, Profile } from "@/lib/types";
import { OnlineIndicator } from "./online-indicator";
import { Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VoiceRecorder } from "./voice-recorder";
import { toast } from "sonner";

interface AIMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    status: "sending" | "sent" | "delivered" | "read";
}

interface ChatViewProps {
    currentUser: any;
    selectedUser: any | null;
    selectedChannel: Channel | null;
    isAIChat: boolean;
    messages: Message[];
    aiMessages: AIMessage[];
    newMessage: string;
    aiTyping: boolean;
    isUploading?: boolean;
    onSendMessage: (e: React.FormEvent) => void;
    onNewMessageChange: (value: string) => void;
    onFileSelect?: (file: File) => void;
    onCloseChat: () => void;
    onStartCall: (type: "voice" | "video") => void;
}

function formatTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLastSeen(dateStr: string | null | undefined): string {
    if (!dateStr) return "long time ago";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    return date.toLocaleDateString();
}

function MessageStatus({ status, isRead }: { status: string; isRead: boolean }) {
    if (isRead || status === "read") {
        return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />; // Blue for Read
    }
    if (status === "delivered") {
        return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />; // Double Grey for Delivered
    }
    if (status === "sent") {
        return <Check className="h-3.5 w-3.5 text-muted-foreground" />; // Single Grey for Sent
    }
    return <Clock className="h-3 w-3 text-muted-foreground/70" />;
}

function getInitials(name: string | null, email: string) {
    return name
        ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : email[0].toUpperCase();
}

export function ChatView({
    currentUser,
    selectedUser,
    selectedChannel,
    isAIChat,
    messages,
    aiMessages,
    newMessage,
    aiTyping,
    isUploading = false,
    onSendMessage,
    onNewMessageChange,
    onFileSelect,
    onCloseChat,
    onStartCall,
}: ChatViewProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, aiMessages, isRecording]);

    const isOnline = (user: any) => user?.online_status === "online";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect?.(e.target.files[0]);
        }
        e.target.value = "";
    };

    const triggerFileUpload = (accept: string) => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-background">
            {/* Chat Header */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-md shadow-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 md:hidden rounded-full hover:bg-muted/80"
                    onClick={onCloseChat}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="relative shrink-0">
                    {isAIChat ? (
                        <div className="relative flex-shrink-0 transition-transform group-hover:scale-105">
                            <Avatar className="h-14 w-14 bg-linear-to-tr from-primary via-primary/80 to-primary/60 shadow-md">
                                <AvatarFallback className="bg-transparent text-white">
                                    <Bot className="h-6 w-6" />
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    ) : selectedUser ? (
                        <Avatar className="h-11 w-11 shadow-sm border-2 border-background">
                            <AvatarImage src={selectedUser.avatar_url || ""} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-base">
                                {getInitials(selectedUser.full_name, selectedUser.email)}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="h-11 w-11 rounded-2xl bg-muted/80 flex items-center justify-center border-2 border-background shadow-sm">
                            <Hash className="h-6 w-6 text-muted-foreground" />
                        </div>
                    )}
                    {selectedUser && !isAIChat && (
                        <OnlineIndicator status={isOnline(selectedUser) ? "online" : "offline"} size="md" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-base truncate text-foreground leading-tight">
                        {isAIChat
                            ? "HG Core Agent"
                            : selectedUser?.full_name || selectedUser?.email || selectedChannel?.name}
                    </h2>
                    <p className="text-[11px] font-bold text-muted-foreground/80 truncate uppercase tracking-wider">
                        {isAIChat
                            ? "AI Response Active"
                            : selectedUser
                                ? isOnline(selectedUser)
                                    ? "Online Now"
                                    : `Active ${formatLastSeen(selectedUser.last_seen_at)}`
                                : "Shared Channel"}
                    </p>
                </div>

                {selectedUser && !isAIChat && (
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:bg-muted/80 hover:text-primary rounded-full transition-colors"
                            onClick={() => onStartCall("video")}
                        >
                            <Video className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:bg-muted/80 hover:text-primary rounded-full transition-colors"
                            onClick={() => onStartCall("voice")}
                        >
                            <Phone className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-muted/80 rounded-full transition-colors">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Search Chat</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Mute Notifications</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239C92AC' fillOpacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }}
            >
                {!isAIChat &&
                    messages.map((msg) => {
                        const isOwn = msg.sender_id === currentUser.id;
                        const hasAttachments = msg.attachments && msg.attachments.length > 0;
                        return (
                            <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                                <div
                                    className={cn(
                                        "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative group transition-all hover:shadow-md",
                                        isOwn
                                            ? "bg-linear-to-b from-[#d9fdd3] to-[#d1f9cc] dark:from-[#005c4b] dark:to-[#005445] rounded-tr-none text-[#111b21] dark:text-[#e9edef]"
                                            : "bg-linear-to-b from-white to-[#f8f9fa] dark:from-[#202c33] dark:to-[#1a2329] rounded-tl-none text-[#111b21] dark:text-[#e9edef]"
                                    )}
                                >
                                    {/* Attachments */}
                                    {hasAttachments && (
                                        <div className="mb-1 flex flex-col gap-1">
                                            {msg.attachments!.map((url, idx) => {
                                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                                const isVideo = /\.(mp4|webm|mov)$/i.test(url);
                                                const isAudio = /\.(mp3|wav|ogg|webm)$/i.test(url) || (url.includes('audio') && !isVideo);

                                                if (isImage) {
                                                    return (
                                                        <a href={url} target="_blank" rel="noopener noreferrer" key={idx} className="block overflow-hidden rounded-lg">
                                                            <img src={url} alt="Attachment" className="max-w-full h-auto object-cover max-h-[300px]" />
                                                        </a>
                                                    );
                                                }
                                                if (isVideo) {
                                                    return (
                                                        <div key={idx} className="rounded-lg overflow-hidden max-w-[300px]">
                                                            <video src={url} controls className="max-w-full h-auto" />
                                                        </div>
                                                    )
                                                }
                                                if (isAudio) {
                                                    return (
                                                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg min-w-[200px]">
                                                            <Headphones className="h-5 w-5 text-muted-foreground" />
                                                            <audio src={url} controls className="h-8 max-w-[200px]" />
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <a href={url} target="_blank" rel="noopener noreferrer" key={idx} className="flex items-center gap-3 p-3 bg-muted/10 border rounded-lg hover:bg-muted/20 transition-colors">
                                                        <div className="h-10 w-10 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-lg flex items-center justify-center">
                                                            <FileText className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-sm font-medium truncate">{url.split('/').pop()?.split('-').slice(1).join('-') || "Document"}</p>
                                                            <p className="text-xs text-muted-foreground uppercase">{url.split('.').pop()}</p>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {msg.content && (
                                        <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">{msg.content}</div>
                                    )}

                                    <div className={cn("flex items-center gap-1 mt-0.5 select-none", isOwn ? "justify-end" : "justify-end")}>
                                        <span className="text-[11px] text-muted-foreground/80">{formatTime(msg.created_at)}</span>
                                        {isOwn && <MessageStatus status={msg.status || "sent"} isRead={msg.is_read} />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {isAIChat && aiMessages.map((msg) => {
                    const isOwn = msg.role === "user";
                    return (
                        <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm transition-all hover:shadow-md", isOwn ? "bg-linear-to-b from-[#d9fdd3] to-[#d1f9cc] dark:from-[#005c4b] dark:to-[#005445] rounded-tr-none" : "bg-linear-to-b from-white to-[#f8f9fa] dark:from-[#202c33] dark:to-[#1a2329] rounded-tl-none")}>
                                <p className="text-[15px] break-words whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                <span className="text-[10px] font-bold text-muted-foreground/60 block text-right mt-1.5 uppercase">{formatTime(msg.timestamp)}</span>
                            </div>
                        </div>
                    )
                })}

                {aiTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-[#202c33] px-3 py-2 rounded-2xl shadow-sm"><span className="animate-pulse text-muted-foreground text-sm">typing...</span></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="sticky bottom-0 bg-background p-2 px-3 sm:px-4 py-2 safa-area-inset">
                {isRecording ? (
                    <VoiceRecorder
                        onRecordingComplete={(file) => {
                            setIsRecording(false);
                            onFileSelect?.(file);
                        }}
                        onCancel={() => setIsRecording(false)}
                    />
                ) : (
                    <form onSubmit={onSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto w-full">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-muted-foreground hover:bg-muted/50 rounded-full mb-1"
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Paperclip className="h-6 w-6" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56" side="top">
                                <DropdownMenuItem onClick={() => triggerFileUpload("image/*,video/*")}>
                                    <ImageIcon className="mr-2 h-4 w-4 text-purple-500" /> Photos & Videos
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { }}>
                                    <Camera className="mr-2 h-4 w-4 text-pink-500" /> Camera
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => triggerFileUpload(".pdf,.doc,.docx,.txt")}>
                                    <FileText className="mr-2 h-4 w-4 text-blue-500" /> Document
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { toast.info("Contact sharing coming soon") }}>
                                    <UserIcon className="mr-2 h-4 w-4 text-blue-400" /> Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { toast.info("Polls coming soon") }}>
                                    <BarChart2 className="mr-2 h-4 w-4 text-yellow-500" /> Poll
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { toast.info("Events coming soon") }}>
                                    <Calendar className="mr-2 h-4 w-4 text-green-500" /> Event
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Input
                            ref={inputRef}
                            value={newMessage}
                            onChange={(e) => onNewMessageChange(e.target.value)}
                            placeholder="Type a message"
                            className="flex-1 min-w-0 bg-secondary/50 border-0 focus-visible:ring-0 rounded-2xl px-4 py-3 min-h-[44px] max-h-32"
                            autoComplete="off"
                        />

                        {newMessage.trim() ? (
                            <Button
                                type="submit"
                                size="icon"
                                className="h-10 w-10 rounded-full flex-shrink-0 bg-primary mb-1 transition-all duration-200"
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="icon"
                                className="h-10 w-10 rounded-full flex-shrink-0 text-muted-foreground hover:bg-muted/50 mb-1"
                                onClick={() => setIsRecording(true)}
                            >
                                <Mic className="h-6 w-6" />
                            </Button>
                        )}

                    </form>
                )}
            </div>
        </div>
    );
}
