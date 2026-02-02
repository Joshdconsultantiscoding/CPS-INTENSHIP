"use client";

import React, { useEffect, useRef, useState } from "react";
import { getSyncedTime } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Send,
    ArrowLeft,
    Phone,
    Video,
    MoreVertical,
    Bot,
    Hash,
    Check,
    CheckCheck,
    Clock,
    Paperclip,
    ImageIcon,
    Mic,
    Camera,
    FileText,
    User as UserIcon,
    BarChart2,
    Calendar,
    X,
    Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, Channel } from "@/lib/types";
import { OnlineIndicator } from "./online-indicator";
import { Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VoiceRecorder } from "./voice-recorder";
import { toast } from "sonner";
import { CldUploadWidget } from "next-cloudinary";

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
    onSendMessage: (e?: React.FormEvent, attachmentUrl?: string) => void;
    onNewMessageChange: (value: string) => void;
    onFileSelect?: (file: File) => void;
    onCloseChat: () => void;
    onStartCall: (type: "voice" | "video") => void;
    onViewContact?: () => void;
    onClearMessages?: () => void;
    onMute?: (muted: boolean) => void;
    isOnline?: boolean;
}

function formatTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLastSeen(dateStr: string | null | undefined): string {
    if (!dateStr) return "offline";
    const date = new Date(dateStr);
    const now = getSyncedTime();

    // Day comparison using normalized date strings
    const dateDay = date.toDateString();
    const nowDay = now.toDateString();

    // Check if it was yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDay = yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

    if (dateDay === nowDay) return `today at ${timeStr}`;
    if (dateDay === yesterdayDay) return `yesterday at ${timeStr}`;

    return `${date.toLocaleDateString()} at ${timeStr}`;
}

function MessageStatus({ status, isRead }: { status: string; isRead: boolean }) {
    if (isRead || status === "read") {
        return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    }
    if (status === "delivered") {
        return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    if (status === "sent") {
        return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    return <Clock className="h-3 w-3 text-muted-foreground/70" />;
}

function getInitials(profile: any) {
    if (profile.first_name || profile.last_name) {
        return `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();
    }
    return profile.full_name
        ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        : profile.email ? profile.email[0].toUpperCase() : "?";
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
    onViewContact,
    onClearMessages,
    onMute,
    isOnline = false,
}: ChatViewProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, aiMessages, isRecording, aiTyping]);

    return (
        <div className="flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] relative overflow-hidden">
            {/* Professional Background Pattern */}
            <div
                className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
                    backgroundSize: '400px'
                }}
            />

            {/* Chat Header */}
            <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2 border-b bg-[#f0f2f5] dark:bg-[#202c33] shadow-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 md:hidden rounded-full hover:bg-muted/80"
                    onClick={onCloseChat}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="relative shrink-0 cursor-pointer group" onClick={() => { }}>
                    {isAIChat ? (
                        <Avatar className="h-10 w-10 bg-linear-to-tr from-primary to-primary/60 border border-white/10">
                            <AvatarFallback className="bg-transparent text-white">
                                <Bot className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    ) : selectedUser ? (
                        <Avatar className="h-10 w-10 border border-white/10 group-hover:opacity-90 transition-opacity">
                            <AvatarImage src={selectedUser.avatar_url || ""} />
                            <AvatarFallback className="bg-slate-400 text-white text-sm">
                                {getInitials(selectedUser)}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-500 flex items-center justify-center border border-white/10">
                            <Hash className="h-5 w-5 text-white" />
                        </div>
                    )}
                    {selectedUser && !isAIChat && (
                        <OnlineIndicator status={isOnline ? "online" : "offline"} size="sm" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-base truncate text-foreground leading-tight">
                        {isAIChat
                            ? "HG Core Agent"
                            : (selectedUser?.first_name || selectedUser?.last_name)
                                ? `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim()
                                : selectedUser?.full_name || selectedUser?.email || selectedChannel?.name}
                    </h2>
                    <div className="flex items-center gap-1.5 h-4">
                        {aiTyping ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium animate-pulse">typing...</span>
                        ) : (
                            <div className="text-[11px] text-muted-foreground truncate uppercase tracking-widest font-bold">
                                {isAIChat
                                    ? "AI Assistant Active"
                                    : selectedUser ? (
                                        isOnline ? (
                                            <span className="text-green-600 font-medium flex items-center gap-1">
                                                <span className="block h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                                                Online
                                            </span>
                                        ) : (
                                            <span>LAST SEEN {formatLastSeen(selectedUser.last_seen_at)}</span>
                                        )
                                    ) : "Community Group"}
                            </div>
                        )}
                    </div>
                </div>

                {selectedUser && !isAIChat && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                            onClick={() => onStartCall("video")}
                        >
                            <Video className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                            onClick={() => onStartCall("voice")}
                        >
                            <Phone className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={onViewContact}>Contact info</DropdownMenuItem>
                                <DropdownMenuItem>Select messages</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onMute?.(true)}>Mute notifications</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={onClearMessages}>Clear messages</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Message Area */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-1 z-10"
            >
                {!isAIChat &&
                    messages.map((msg, idx) => {
                        const isOwn = msg.sender_id === currentUser.id;
                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        const isSameSender = prevMsg?.sender_id === msg.sender_id;
                        const hasAttachments = msg.attachments && msg.attachments.length > 0;

                        return (
                            <div key={msg.id} className={cn("flex w-full mb-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300", isOwn ? "justify-end" : "justify-start", !isSameSender && "mt-3")}>
                                <div
                                    className={cn(
                                        "max-w-[85%] sm:max-w-[70%] rounded-xl px-2 py-1 shadow-sm relative transition-all hover:shadow-md",
                                        isOwn
                                            ? "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none text-[#111b21] dark:text-[#e9edef]"
                                            : "bg-white dark:bg-[#202c33] rounded-tl-none text-[#111b21] dark:text-[#e9edef]",
                                        !isSameSender && (isOwn ? "rounded-tr-none" : "rounded-tl-none")
                                    )}
                                >
                                    {/* Tail */}
                                    {!isSameSender && (
                                        <div className={cn(
                                            "absolute top-0 w-2 h-2.5",
                                            isOwn
                                                ? "right-[-8px] bg-[#d9fdd3] dark:bg-[#005c4b] [clip-path:polygon(0_0,0_100%,100%_0)]"
                                                : "left-[-8px] bg-white dark:bg-[#202c33] [clip-path:polygon(100%_0,100%_100%,0_0)]"
                                        )} />
                                    )}

                                    {/* Attachments (WhatsApp Style) */}
                                    {hasAttachments && (
                                        <div className="p-0.5 rounded-lg overflow-hidden bg-black/5 dark:bg-black/20 mb-1">
                                            {msg.attachments!.map((url, i) => {
                                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes("cloudinary");
                                                if (isImage) {
                                                    return (
                                                        <div key={i} className="relative group/img cursor-pointer" onClick={() => setPreviewImage(url)}>
                                                            <img src={url} alt="Media" className="max-w-full h-auto rounded-lg object-cover max-h-[400px] border border-black/5" />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                                <Maximize2 className="text-white h-8 w-8" />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <a href={url} target="_blank" rel="noopener noreferrer" key={i} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                                                        <FileText className="h-6 w-6 text-blue-500" />
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-sm font-medium truncate">Document Attachment</p>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="flex items-end gap-2 px-1">
                                        {msg.content && msg.content.startsWith("[CALL_LOG]:") ? (() => {
                                            const [_, type, duration] = msg.content.split(":");
                                            const isMissed = duration === "missed";
                                            const Icon = type === "video" ? Video : Phone;

                                            return (
                                                <div className="flex items-center gap-3 py-2 px-1 min-w-[180px]">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-full flex items-center justify-center",
                                                        isMissed ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30"
                                                    )}>
                                                        <Icon className={cn("h-5 w-5", isMissed ? "text-red-500" : "text-blue-500")} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-bold">
                                                            {isMissed ? `Missed ${type} call` : `${type.charAt(0).toUpperCase() + type.slice(1)} call`}
                                                        </span>
                                                        {!isMissed && (
                                                            <span className="text-[12px] opacity-70">
                                                                Duration: {(() => {
                                                                    const d = parseInt(duration);
                                                                    const mins = Math.floor(d / 60);
                                                                    const secs = d % 60;
                                                                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                                                                })()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })() : msg.content && (
                                            <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap wrap-break-word py-0.5">{msg.content}</p>
                                        )}
                                        <div className="flex items-center gap-1 shrink-0 pb-0.5 ml-auto">
                                            <span className="text-[10px] opacity-60 font-medium">{formatTime(msg.created_at)}</span>
                                            {isOwn && <MessageStatus status={msg.status || "sent"} isRead={msg.is_read} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {isAIChat && aiMessages.map((msg) => {
                    const isOwn = msg.role === "user";
                    return (
                        <div key={msg.id} className={cn("flex w-full mb-3", isOwn ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[85%] sm:max-w-[70%] rounded-xl px-3 py-1.5 shadow-sm relative", isOwn ? "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none" : "bg-white dark:bg-[#202c33] rounded-tl-none")}>
                                <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                                <div className="flex justify-end mt-0.5">
                                    <span className="text-[10px] opacity-60 font-bold uppercase">{formatTime(msg.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Layer */}
            <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-3 py-2 z-20 shadow-2xl">
                {isRecording ? (
                    <VoiceRecorder
                        onRecordingComplete={(file) => {
                            setIsRecording(false);
                            onFileSelect?.(file);
                        }}
                        onCancel={() => setIsRecording(false)}
                    />
                ) : (
                    <div className="flex items-end gap-2 max-w-5xl mx-auto">
                        <div className="flex items-center gap-1">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                aria-label="Upload file"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        onFileSelect?.(e.target.files[0]);
                                        e.target.value = ''; // Reset
                                    }
                                }}
                                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                disabled={isUploading}
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex-1 relative flex items-center bg-white dark:bg-[#2a3942] rounded-lg shadow-sm border border-black/5 dark:border-white/5 pr-2">
                            <textarea
                                rows={1}
                                value={newMessage}
                                onChange={(e) => onNewMessageChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onSendMessage();
                                    }
                                }}
                                placeholder="Type a message"
                                className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-2.5 px-3 text-[15px] max-h-32 min-h-[40px] outline-none"
                            />
                        </div>

                        {newMessage.trim() ? (
                            <Button
                                onClick={() => onSendMessage()}
                                size="icon"
                                className="h-11 w-11 rounded-full shrink-0 bg-[#00a884] hover:bg-[#008f72] shadow-md transition-all active:scale-95"
                            >
                                <Send className="h-5 w-5 text-white" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-11 w-11 rounded-full shrink-0 text-muted-foreground hover:bg-black/5"
                                onClick={() => setIsRecording(true)}
                            >
                                <Mic className="h-6 w-6" />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-100 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
                    <Button variant="ghost" size="icon" className="absolute top-6 right-6 text-white hover:bg-white/10 h-12 w-12 rounded-full z-110">
                        <X className="h-8 w-8" />
                    </Button>
                    <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                </div>
            )}
        </div>
    );
}
