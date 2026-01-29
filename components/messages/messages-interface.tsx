"use client";

import React, { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile, Message, Channel } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { generateResponse } from "@/lib/hg-core-knowledge";
import { ChatView } from "./chat-view";
import { ListView } from "./list-view";
import { CallModal } from "./call-modal";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useWebRTC } from "@/hooks/use-webrtc";

interface MessagesInterfaceProps {
  currentUser: User;
  profile: Profile | null;
  users: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    role: string;
    online_status?: string;
    last_seen_at?: string | null;
  }[];
  channels: Channel[];
  conversations: any[];
  initialUserId?: string;
}

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status: "sending" | "sent" | "delivered" | "read";
}

function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string | null, email: string) {
  return name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email[0].toUpperCase();
}

export function MessagesInterface({
  currentUser,
  profile,
  users,
  channels,
  conversations: initialConversations,
  initialUserId,
}: MessagesInterfaceProps) {
  // Chat State
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isAIChat, setIsAIChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showChat, setShowChat] = useState(false);

  // Call State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [incomingCaller, setIncomingCaller] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  const [activeCallChannel, setActiveCallChannel] = useState<RealtimeChannel | null>(null);
  const [pendingOffer, setPendingOffer] = useState<RTCSessionDescriptionInit | null>(null);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);

  const webrtc = useWebRTC(currentUser);
  const supabaseRef = useRef(createClient());

  // Presence
  useEffect(() => {
    const supabase = supabaseRef.current;

    // Set self as online immediately clearly
    const updateSelfOnline = async () => {
      await supabase.from("profiles").update({ online_status: "online", last_seen_at: new Date().toISOString() }).eq("id", currentUser.id);
    };
    updateSelfOnline();

    // Track others
    const channel = supabase.channel("presence_tracking", { config: { presence: { key: currentUser.id } } });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const p = new Set<string>();
      Object.keys(state).forEach(k => p.add(k));
      setOnlineUsers(p);
    }).subscribe(status => {
      if (status === 'SUBSCRIBED') {
        channel.track({ user_id: currentUser.id, online_at: new Date().toISOString() });
      }
    });

    return () => { channel.unsubscribe(); }
  }, [currentUser.id]);

  // Hook up WebRTC signals
  useEffect(() => {
    const supabase = supabaseRef.current;
    const myChannel = supabase.channel(`calls:${currentUser.id}`);

    myChannel
      .on("broadcast", { event: "incoming-call" }, ({ payload }) => {
        if (payload.caller.id === currentUser.id || showCallModal) return;
        setIncomingCaller(payload.caller);
        setCallType(payload.type);
        setShowCallModal(true);
        const callerChannel = supabase.channel(`calls:${payload.caller.id}`);
        callerChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setActiveCallChannel(callerChannel);
            webrtc.updateChannel(callerChannel);
          }
        });
      })
      .on("broadcast", { event: "signal" }, ({ payload }) => {
        if (payload.offer) setPendingOffer(payload.offer);
        else webrtc.handleSignal(payload);
      })
      .on("broadcast", { event: "hangup" }, () => {
        webrtc.endCall();
        setShowCallModal(false);
        setIncomingCaller(null);
        setPendingOffer(null);
        if (activeCallChannel) {
          activeCallChannel.unsubscribe();
          setActiveCallChannel(null);
        }
        toast.info("Call ended");
      })
      .subscribe();

    return () => { myChannel.unsubscribe(); };
  }, [currentUser.id, showCallModal, activeCallChannel]);

  // Auto-select user if passed via query param
  useEffect(() => {
    if (initialUserId) {
      const user = users.find((u) => u.id === initialUserId);
      if (user) {
        setSelectedUser(user);
        setSelectedChannel(null);
        setIsAIChat(false);
        setShowChat(true);
      }
    }
  }, [initialUserId, users]);

  // Messages Fetch & Realtime
  useEffect(() => {
    if (isAIChat || (!selectedUser && !selectedChannel)) return;
    const supabase = supabaseRef.current;

    // Fetch initial messages and mark as read if needed
    let q = supabase.from("messages").select("*, sender:profiles!messages_sender_id_fkey(*)").order("created_at", { ascending: true });
    if (selectedUser) {
      q = q.or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${currentUser.id})`);

      // Immediate Read Mark
      supabase.from("messages").update({ is_read: true, status: 'read', read_at: new Date().toISOString() })
        .eq("sender_id", selectedUser.id).eq("recipient_id", currentUser.id).eq("is_read", false)
        .then();
    }
    else if (selectedChannel) q = q.eq("channel_id", selectedChannel.id);

    q.then(({ data }) => {
      if (data) setMessages(data as Message[]);
    });

    const cid = selectedUser ? `dm-${[currentUser.id, selectedUser.id].sort().join("-")}` : `ch-${selectedChannel?.id}`;

    const sub = supabase.channel(cid)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const newMsg = payload.new as Message;
        let relevant = false;

        if (selectedUser) relevant = (newMsg.sender_id === currentUser.id && newMsg.recipient_id === selectedUser.id) || (newMsg.sender_id === selectedUser.id && newMsg.recipient_id === currentUser.id);
        else if (selectedChannel) relevant = newMsg.channel_id === selectedChannel.id;

        if (relevant) {
          const { data: sender } = await supabase.from("profiles").select("*").eq("id", newMsg.sender_id).single();
          setMessages(prev => {
            // Prevent duplicates (optimistic vs real)
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev.filter(m => !String(m.id).startsWith("temp-")), { ...newMsg, sender }];
          });

          // If I received it, Mark as Delivered & Read (since chat is open)
          if (newMsg.sender_id !== currentUser.id) {
            await supabase.from("messages").update({
              is_read: true,
              status: 'read',
              delivered_at: new Date().toISOString(),
              read_at: new Date().toISOString()
            }).eq("id", newMsg.id);
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updatedMsg = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
      })
      .subscribe();

    return () => { sub.unsubscribe(); }
  }, [selectedUser, selectedChannel, currentUser.id, isAIChat]);

  // AI Mock Init
  useEffect(() => {
    if (isAIChat && aiMessages.length === 0) {
      setAiMessages([{
        id: "greeting", role: "assistant", content: "Hello! I'm HG Core Assistant. I can help with platform rules, daily reports, tasks, and points. What do you need?", timestamp: new Date(), status: "read",
      }]);
    }
  }, [isAIChat, aiMessages.length]);

  const startCall = async (type: "voice" | "video") => {
    if (isAIChat) { toast.error("Cannot call AI"); return; }
    if (!selectedUser) return;

    setCallType(type);
    setShowCallModal(true);

    const supabase = supabaseRef.current;
    const channel = supabase.channel(`calls:${selectedUser.id}`);

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setActiveCallChannel(channel);
        webrtc.updateChannel(channel);

        await channel.send({
          type: "broadcast",
          event: "incoming-call",
          payload: {
            type,
            caller: {
              id: currentUser.id,
              name: profile?.full_name || currentUser.email,
              avatar_url: profile?.avatar_url
            }
          }
        });

        await webrtc.startCall(type === "video");
      }
    });
  };

  const handleAnswerCall = async () => {
    if (pendingOffer && activeCallChannel) {
      await webrtc.answerCall(callType === "video", pendingOffer);
      setPendingOffer(null);
    }
  };

  const handleEndCall = async () => {
    webrtc.endCall();
    setShowCallModal(false);
    setIncomingCaller(null);
    setPendingOffer(null);

    if (activeCallChannel) {
      await activeCallChannel.send({ type: "broadcast", event: "hangup", payload: {} });
      activeCallChannel.unsubscribe();
      setActiveCallChannel(null);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!selectedUser && !selectedChannel) return;
    setIsUploading(true);

    try {
      const supabase = supabaseRef.current;
      const fileExt = file.name.split('.').pop() || 'file';
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file); // fileName is path

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(fileName);

      // Send Message with Attachment
      await sendMessage(undefined, publicUrl);

    } catch (error: any) {
      console.error("Upload failed", error);
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent, attachmentUrl?: string) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !attachmentUrl) return;

    const content = newMessage.trim();
    setNewMessage("");

    if (isAIChat) {
      const userMsg: AIMessage = { id: `user-${Date.now()}`, role: "user", content: content || "Sent an attachment", timestamp: new Date(), status: "sent" };
      setAiMessages((prev) => [...prev, userMsg]);
      setAiTyping(true);
      setTimeout(async () => {
        const response = generateResponse(content);
        const aiMsg: AIMessage = { id: `ai-${Date.now()}`, role: "assistant", content: "", timestamp: new Date(), status: "read" };
        setAiMessages((prev) => [...prev, aiMsg]);
        setAiTyping(false);
        const words = response.split(" ");
        let current = "";
        for (let i = 0; i < words.length; i++) {
          current += (i === 0 ? "" : " ") + words[i];
          const text = current;
          setAiMessages((prev) => prev.map((m) => m.id === aiMsg.id ? { ...m, content: text } : m));
          await new Promise((r) => setTimeout(r, 20));
        }
      }, 500);
      return;
    }

    if (selectedUser || selectedChannel) {
      const supabase = supabaseRef.current;
      const tempId = `temp-${Date.now()}`;
      const attachments = attachmentUrl ? [attachmentUrl] : [];
      const optimistic = {
        id: tempId, content, sender_id: currentUser.id, recipient_id: selectedUser?.id, channel_id: selectedChannel?.id, created_at: new Date().toISOString(),
        attachments,
        status: "sending",
        is_read: false,
        sender: { id: currentUser.id, full_name: profile?.full_name, avatar_url: profile?.avatar_url }
      } as unknown as Message;

      setMessages(prev => [...prev, optimistic]);

      const { data, error } = await supabase.from("messages").insert({
        content,
        sender_id: currentUser.id,
        recipient_id: selectedUser?.id || null,
        channel_id: selectedChannel?.id || null,
        attachments,
        status: "sent"
      }).select().single();

      if (error) {
        toast.error("Failed to send: " + error.message);
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, ...data, status: "sent" } : m));
      }
    }
  };

  const openChat = (type: "ai" | "user" | "channel", item?: any) => {
    setMessages([]);
    if (type === "ai") {
      setIsAIChat(true); setSelectedUser(null); setSelectedChannel(null);
    } else if (type === "user") {
      setSelectedUser(item); setSelectedChannel(null); setIsAIChat(false);
    } else if (type === "channel") {
      setSelectedChannel(item); setSelectedUser(null); setIsAIChat(false);
    }
    setShowChat(true);
  };

  const isOnline = (id: string) => onlineUsers.has(id) || users.find(u => u.id === id)?.online_status === "online";
  const getStatus = (id: string) => isOnline(id) ? "online" : (users.find(u => u.id === id)?.online_status || "offline");

  return (
    <>
      <CallModal
        isOpen={showCallModal}
        onClose={handleEndCall}
        caller={incomingCaller ? { name: incomingCaller.name, avatar_url: incomingCaller.avatar_url } : (selectedUser ? { name: selectedUser.full_name || selectedUser.email, avatar_url: selectedUser.avatar_url } : null)}
        isVideo={callType === "video"}
        isIncoming={!!incomingCaller}
        localStream={webrtc.localStream}
        remoteStream={webrtc.remoteStream}
        onAnswer={handleAnswerCall}
        onEnd={handleEndCall}
        onToggleMic={webrtc.toggleMic}
        onToggleVideo={webrtc.toggleVideo}
      />

      <div className="fixed inset-0 top-[56px] sm:top-[64px] bottom-[64px] md:bottom-0 md:relative md:inset-auto md:h-[calc(100vh-8rem)] flex bg-background rounded-none md:rounded-xl md:border shadow-sm overflow-hidden z-20">
        {/* Mobile */}
        <div className="w-full md:hidden">
          {showChat ? (
            <ChatView
              currentUser={currentUser}
              selectedUser={selectedUser}
              selectedChannel={selectedChannel}
              isAIChat={isAIChat}
              messages={messages}
              aiMessages={aiMessages}
              newMessage={newMessage}
              aiTyping={aiTyping}
              isUploading={isUploading}
              onSendMessage={sendMessage}
              onNewMessageChange={setNewMessage}
              onFileSelect={handleFileSelect}
              onCloseChat={() => setShowChat(false)}
              onStartCall={startCall}
            />
          ) : (
            <ListView
              currentUser={currentUser}
              users={users}
              channels={channels}
              conversations={initialConversations}
              showSearch={showSearch}
              searchQuery={searchQuery}
              onToggleSearch={() => setShowSearch(!showSearch)}
              onSearchChange={setSearchQuery}
              onOpenChat={openChat}
              getInitials={getInitials}
              formatTime={formatTime}
              getStatus={getStatus}
            />
          )}
        </div>

        {/* Desktop */}
        <div className="hidden md:flex w-full">
          <div className="w-80 lg:w-96 border-r flex-shrink-0 overflow-hidden">
            <ListView
              currentUser={currentUser}
              users={users}
              channels={channels}
              conversations={initialConversations}
              showSearch={showSearch}
              searchQuery={searchQuery}
              onToggleSearch={() => setShowSearch(!showSearch)}
              onSearchChange={setSearchQuery}
              onOpenChat={openChat}
              getInitials={getInitials}
              formatTime={formatTime}
              getStatus={getStatus}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            {!selectedUser && !selectedChannel && !isAIChat ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">👋</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Welcome to Messages</h3>
                <p className="max-w-xs mx-auto">Select a chat from the list to start messaging.</p>
              </div>
            ) : (
              <ChatView
                currentUser={currentUser}
                selectedUser={selectedUser}
                selectedChannel={selectedChannel}
                isAIChat={isAIChat}
                messages={messages}
                aiMessages={aiMessages}
                newMessage={newMessage}
                aiTyping={aiTyping}
                isUploading={isUploading}
                onSendMessage={sendMessage}
                onNewMessageChange={setNewMessage}
                onFileSelect={handleFileSelect}
                onCloseChat={() => setShowChat(false)}
                onStartCall={startCall}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
