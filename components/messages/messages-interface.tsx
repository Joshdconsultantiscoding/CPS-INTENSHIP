"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile, Message, Channel } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { generateResponse } from "@/lib/hg-core-knowledge";
import { ChatView } from "./chat-view";
import { ListView } from "./list-view";
import { CallModal } from "./call-modal";
import { useAbly } from "@/providers/ably-provider";
import { useLiveKit } from "@/hooks/use-livekit";
import { syncServerTime, getSyncedISOString, getSyncedTime } from "@/lib/time";

interface MessagesInterfaceProps {
  currentUser: User;
  profile: Profile | null;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
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
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function getInitials(profile: { first_name?: string | null; last_name?: string | null; full_name?: string | null; email?: string }) {
  if (profile.first_name || profile.last_name) {
    return `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();
  }
  return profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : profile.email ? profile.email[0].toUpperCase() : "?";
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
  const [usersState, setUsersState] = useState(users);
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isAIChat, setIsAIChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Call State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [incomingCaller, setIncomingCaller] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  const [callRoomName, setCallRoomName] = useState<string | null>(null);

  // Media State
  const [isUploading, setIsUploading] = useState(false);

  const supabase = createClient();
  const { client: ably, status: ablyStatus, isOffline, isConfigured } = useAbly();
  const livekit = useLiveKit();

  // Check if Ably is available and connected
  const ablyAvailable = !isOffline && isConfigured && ably && ably.connection?.state === 'connected';

  // ============================================
  // PRESENCE: Polling-based (always works)
  // ============================================
  // ============================================
  // REAL-TIME PRESENCE (Supabase)
  // ============================================
  useEffect(() => {
    const presenceChannel = supabase.channel('global-presence');

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const onlineIds = new Set<string>();

        Object.values(newState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id) onlineIds.add(p.user_id);
          });
        });

        setOnlineUserIds(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: currentUser.id,
            online_at: getSyncedISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser.id, supabase]);

  // ============================================
  // REAL-TIME PROFILE UPDATES (Last Seen / Status)
  // ============================================
  useEffect(() => {
    const channel = supabase.channel('public:profiles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updatedProfile = payload.new;

          setUsersState(prev => {
            const exists = prev.find(u => u.id === updatedProfile.id);
            if (exists) {
              return prev.map(u => u.id === updatedProfile.id ? { ...u, ...updatedProfile } : u);
            }
            return [...prev, updatedProfile as any];
          });

          if (selectedUser?.id === updatedProfile.id) {
            setSelectedUser(prev => prev ? ({ ...prev, ...updatedProfile } as any) : null);
          }
        }
      )
      .subscribe();

    // Periodic bulk refresh every 2 mins as safety net
    const fetchUsers = async () => {
      const { data } = await supabase.from("profiles").select("*");
      if (data) setUsersState(data);
    };
    const interval = setInterval(fetchUsers, 120000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [supabase, selectedUser?.id]);

  // ============================================
  // DATABASE PRESENCE & LAST SEEN
  // ============================================
  useEffect(() => {
    const updateStatus = async () => {
      const nowSynced = getSyncedISOString();
      console.log(`[Presence] Heartbeat for ${currentUser.id} at ${nowSynced}`);

      const { data, error } = await supabase.from("profiles").update({
        online_status: "online",
        last_seen_at: nowSynced,
        last_active_at: nowSynced
      }).eq("id", currentUser.id).select();

      if (error) {
        console.error("[Presence] Heartbeat error:", error.message);
      } else if (data && data.length > 0) {
        console.log("[Presence] Heartbeat OK. Server timestamp:", data[0].last_seen_at);
      } else {
        console.warn("[Presence] Heartbeat NO ROW UPDATED - Possible RLS issue for ID:", currentUser.id);
      }
    };

    syncServerTime().then(() => {
      updateStatus();
    });
    const interval = setInterval(updateStatus, 60000); // 1 min heartbeat

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser.id, supabase]);

  // ============================================
  // ABLY: Real-time messages (optional enhancement)
  // ============================================
  useEffect(() => {
    if (!ablyAvailable || !ably) return;
    if (isAIChat || (!selectedUser && !selectedChannel)) return;

    const chatChannelName = selectedUser
      ? `chat:${[currentUser.id, selectedUser.id].sort().join("-")}`
      : `channel:${selectedChannel!.id}`;

    let chatChannel: any;
    try {
      chatChannel = ably.channels.get(chatChannelName);

      // Subscribe to messages for faster delivery
      const messageHandler = (msg: any) => {
        const newMsg = msg.data as Message;
        setMessages((prev) => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev.filter(m => !String(m.id).startsWith("temp-")), newMsg];
        });
      };

      // Subscribe to typing indicators
      const typingHandler = (msg: any) => {
        if (msg.data?.userId !== currentUser.id) {
          setPeerTyping(true);
          setTimeout(() => setPeerTyping(false), 2500);
        }
      };

      chatChannel.subscribe("message", messageHandler);
      chatChannel.subscribe("typing", typingHandler);

      return () => {
        try {
          chatChannel.unsubscribe("message", messageHandler);
          chatChannel.unsubscribe("typing", typingHandler);
        } catch (e) { /* ignore cleanup errors */ }
      };
    } catch (e) {
      console.warn("Ably subscription failed:", e);
    }
  }, [ablyAvailable, ably, isAIChat, selectedUser, selectedChannel, currentUser.id]);

  // ============================================
  // ABLY: Incoming Call Notifications
  // ============================================
  useEffect(() => {
    // ONLY subscribe if Ably is actually connected to prevent "Connection closed" errors
    if (!ably || !isConfigured || ably.connection.state !== 'connected') return;

    let userChannel: any;
    try {
      userChannel = ably.channels.get(`user-notifications:${currentUser.id}`);

      const incomingCallHandler = (msg: any) => {
        setIncomingCaller(msg.data.caller);
        setCallType(msg.data.type);
        setCallRoomName(msg.data.roomName);
        setShowCallModal(true);
      };

      const callEndedHandler = () => {
        if (showCallModal) {
          setShowCallModal(false);
          setIncomingCaller(null);
          livekit.disconnect();
          toast.info("Call ended by other party");
        }
      };

      userChannel.subscribe("incoming-call", incomingCallHandler);
      userChannel.subscribe("call-ended", callEndedHandler);

      return () => {
        try {
          userChannel.unsubscribe("incoming-call", incomingCallHandler);
          userChannel.unsubscribe("call-ended", callEndedHandler);
        } catch (e) { /* ignore */ }
      };
    } catch (e) {
      console.warn("Call notification subscription failed:", e);
    }
  }, [ably, currentUser.id, showCallModal, livekit, isConfigured, ablyAvailable]);

  // ============================================
  // AUTO-SELECT USER FROM URL PARAM
  // ============================================
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

  // ============================================
  // SUPABASE: Fetch Messages + Real-time Subscription
  // Helper to enrich message with sender details
  const enrichMessage = useCallback((msg: any): Message => {
    let sender = usersState.find(u => u.id === msg.sender_id);
    if (!sender && msg.sender_id === currentUser.id) {
      sender = profile as any;
    }

    return {
      ...msg,
      sender: sender || {
        id: msg.sender_id,
        full_name: "Unknown User",
        email: "",
        avatar_url: null
      }
    };
  }, [usersState, profile, currentUser.id]);

  // Initial Messages Fetch + Supabase Realtime Subscription
  useEffect(() => {
    if (isAIChat || (!selectedUser && !selectedChannel)) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      let q = supabase.from("messages").select("*").order("created_at", { ascending: true });
      if (selectedUser) {
        q = q.or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${currentUser.id})`);
      } else if (selectedChannel) {
        q = q.eq("channel_id", selectedChannel.id);
      }
      const { data } = await q;
      if (data) {
        const enriched = data.map(enrichMessage);
        setMessages(enriched);
      }
    };

    fetchMessages();

    // Supabase Realtime subscription (works without Ably)
    const channelName = selectedUser
      ? `messages-dm-${[currentUser.id, selectedUser.id].sort().join("-")}`
      : `messages-channel-${selectedChannel!.id}`;

    const realtimeChannel = supabase.channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, async (payload: any) => {
        // ... (existing message handling logic remains same) ...
        const newRow = payload.new;
        const isRelevant = selectedUser
          ? (newRow.sender_id === currentUser.id && newRow.recipient_id === selectedUser.id) ||
          (newRow.sender_id === selectedUser.id && newRow.recipient_id === currentUser.id)
          : newRow.channel_id === selectedChannel?.id;

        if (!isRelevant) return;

        if (!isRelevant) return;

        // Determine sender
        let sender = usersState.find(u => u.id === newRow.sender_id);
        if (!sender && newRow.sender_id === currentUser.id) {
          sender = profile as any;
        }

        // If still not found, fetch it
        if (!sender) {
          const { data: fetchedSender } = await supabase.from("profiles").select("*").eq("id", newRow.sender_id).single();
          if (fetchedSender) sender = fetchedSender as any;
        }

        const newMsg: Message = {
          ...newRow,
          sender: sender || { id: newRow.sender_id, full_name: "Unknown", email: "", avatar_url: null }
        };

        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev.filter(m => !String(m.id).startsWith("temp-")), newMsg];
        });
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (payload.userId !== currentUser.id) {
          setPeerTyping(true);
          // Clear previous timeout if exists
          // (Note: simple timeout reset for now)
          setTimeout(() => setPeerTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [selectedUser, selectedChannel, isAIChat, currentUser.id, supabase, enrichMessage, usersState, profile]);

  // ============================================
  // AI CHAT INITIALIZATION
  // ============================================
  useEffect(() => {
    if (isAIChat && aiMessages.length === 0) {
      setAiMessages([{
        id: "greeting",
        role: "assistant",
        content: "Hello! I'm HG Core Assistant. I can help with platform rules, daily reports, tasks, and points. What do you need?",
        timestamp: new Date(),
        status: "read",
      }]);
    }
  }, [isAIChat, aiMessages.length]);

  // ============================================
  // CALL FUNCTIONS
  // ============================================
  const startCall = async (type: "voice" | "video") => {
    if (isAIChat) {
      toast.error("Cannot call AI assistant");
      return;
    }
    if (!selectedUser) {
      toast.error("Select a user to call");
      return;
    }

    const roomName = `room-${[currentUser.id, selectedUser.id].sort().join("-")}-${Math.floor(Date.now() / 60000)}`; // Increased stability to 1 minute
    setCallType(type);
    setCallRoomName(roomName);
    setIncomingCaller(null);
    setShowCallModal(true);

    // 1. Notify the target user IMMEDIATELY (Signaling First)
    if (ably) {
      console.log(`[MessagesInterface] Attempting to notify user ${selectedUser.id} of incoming call`);
      try {
        const notifyChannel = ably.channels.get(`user-notifications:${selectedUser.id}`);
        // No await here to prevent blocking
        notifyChannel.publish("incoming-call", {
          type,
          roomName,
          caller: {
            id: currentUser.id,
            name: profile?.full_name || currentUser.email,
            avatar_url: profile?.avatar_url
          }
        }).then(() => console.log(`[MessagesInterface] Call notification published successfully`))
          .catch(err => console.warn("[MessagesInterface] Failed to publish call notify:", err));
      } catch (e) {
        console.warn("[MessagesInterface] Failed to get Ably channel:", e);
      }
    } else {
      console.warn("[MessagesInterface] Ably not available for signaling");
    }

    // 2. Then attempt to join room (Media Second)
    try {
      await livekit.connect(roomName, profile?.full_name || currentUser.email || "User");
    } catch (e) {
      console.error("Failed to connect to LiveKit:", e);
      toast.error("Media connection failed, signaling sent.");
    }
  };

  const handleAnswerCall = async () => {
    if (callRoomName) {
      const toastId = toast.loading("Joining call...");
      try {
        await livekit.connect(callRoomName, profile?.full_name || currentUser.email || "User");
        toast.dismiss(toastId);
      } catch (e) {
        console.error("Failed to answer call:", e);
        toast.error("Failed to join call", { id: toastId });
      }
    }
  };

  const handleEndCall = async (durationOrProxy: any = 0, wasConnected: any = false) => {
    // If called from a component event (onClose), first arg might be a proxy or undefined.
    // If called from onEnd, it passed (duration, connected).
    const finalDuration = typeof durationOrProxy === 'number' ? durationOrProxy : 0;
    const finalConnected = typeof wasConnected === 'boolean' ? wasConnected : false;

    console.log(`[MessagesInterface] handleEndCall: duration=${finalDuration}, connected=${finalConnected}`);

    // Guard: Prevent double execution if already cleaning up
    if (!showCallModal && !callRoomName) {
      console.log("[MessagesInterface] handleEndCall skipped (already closing)");
      return;
    }

    const isInitiator = !incomingCaller;
    const targetUserId = incomingCaller?.id || selectedUser?.id;

    console.log(`[MessagesInterface] End Call Sync: isInitiator=${isInitiator}, target=${targetUserId}`);

    // Disconnect from LiveKit
    try {
      await livekit.disconnect();
    } catch (e) {
      console.warn("[MessagesInterface] Disconnect error:", e);
    }

    // Notify peer that call ended
    if (targetUserId && ably) {
      try {
        const notifyChannel = ably.channels.get(`user-notifications:${targetUserId}`);
        await notifyChannel.publish("call-ended", {});
      } catch (e) {
        console.warn("[MessagesInterface] Failed to notify peer via Ably:", e);
      }
    }

    // Log the call in chat history (Only for the initiator)
    if (isInitiator && targetUserId) {
      const callInfo = `[CALL_LOG]:${callType}:${finalConnected ? finalDuration : "missed"}`;
      console.log(`[MessagesInterface] Logging Call to DB: ${callInfo}`);
      try {
        const { sendMessageAction } = await import('@/app/dashboard/messages/actions');
        const res = await sendMessageAction(callInfo, targetUserId, null);
        console.log("[MessagesInterface] Call log DB response:", res);
      } catch (e) {
        console.error("[MessagesInterface] Call log persistence failed:", e);
      }
    }

    setShowCallModal(false);
    setIncomingCaller(null);
    setCallRoomName(null);
  };

  // ============================================
  // FILE UPLOAD
  // ============================================
  // ============================================
  // FILE UPLOAD (Cloudinary via Server Proxy)
  // ============================================
  const handleFileSelect = async (file: File) => {
    if (!selectedUser && !selectedChannel) return;

    // 1. Validate File Size (10MB Limit)
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max limit is ${MAX_SIZE_MB}MB.`);
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading attachment...");

    try {
      // 2. Upload via Server Proxy (Signed)
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch('/api/upload', {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      await sendMessage(undefined, data.secure_url);
      toast.success("Sent successfully", { id: toastId });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed: " + error.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================
  // SEND MESSAGE
  // ============================================
  const sendMessage = async (e?: React.FormEvent, attachmentUrl?: string) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !attachmentUrl) return;

    const content = newMessage.trim();
    setNewMessage("");

    // AI Chat Handler
    if (isAIChat) {
      const userMsg: AIMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content || "Sent an attachment",
        timestamp: new Date(),
        status: "sent"
      };
      setAiMessages((prev) => [...prev, userMsg]);
      setAiTyping(true);

      setTimeout(async () => {
        const response = generateResponse(content);
        const aiMsg: AIMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          status: "read"
        };
        setAiMessages((prev) => [...prev, aiMsg]);
        setAiTyping(false);

        // Typewriter effect
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

    // Regular Message via Supabase
    if (selectedUser || selectedChannel) {
      const attachments = attachmentUrl ? [attachmentUrl] : [];

      // Optimistic UI update
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        content,
        sender_id: currentUser.id,
        recipient_id: selectedUser?.id || null,
        channel_id: selectedChannel?.id || null,
        attachments,
        status: "sending",
        created_at: new Date().toISOString(),
        sender: profile as any,
        is_read: false,
        read_at: null,
      };
      setMessages(prev => [...prev, optimisticMsg]);

      // Use Server Action to send message (Bypasses RLS issues)
      try {
        const { sendMessageAction } = await import('@/app/dashboard/messages/actions');
        const res = await sendMessageAction(
          content,
          selectedUser?.id || null,
          selectedChannel?.id || null,
          attachments
        );

        if (!res.success || !res.message) {
          throw new Error(res.error || "Failed to send message");
        }

        const data = res.message;

        // Replace optimistic with real message, keeping sender info
        const realMsg = { ...data, sender: profile as any };
        setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));

        // Broadcast via Ably for faster delivery to peer
        if (ablyAvailable && ably) {
          try {
            const chatChannelName = selectedUser
              ? `chat:${[currentUser.id, selectedUser.id].sort().join("-")}`
              : `channel:${selectedChannel!.id}`;
            const chatChannel = ably.channels.get(chatChannelName);
            await chatChannel.publish("message", { ...data, sender: profile });
          } catch (ablyError) {
            // Silent fail - message is saved in DB
          }
        }

      } catch (error: any) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error("Failed to send: " + error.message);
      }
    }
  };

  // ============================================
  // TYPING INDICATOR
  // ============================================
  // ============================================
  // TYPING INDICATOR (Supabase Broadcast)
  // ============================================
  const handleTyping = async (value: string) => {
    setNewMessage(value);

    if (!activeUser || !currentUser) return;

    // Only broadcast every 2 seconds max
    if (!isTyping && value.length > 0) {
      setIsTyping(true);

      const channelName = selectedUser
        ? `messages-dm-${[currentUser.id, selectedUser.id].sort().join("-")}`
        : `messages-channel-${selectedChannel!.id}`;

      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id }
      });

      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  // ============================================
  // OPEN CHAT
  // ============================================
  const openChat = (type: "ai" | "user" | "channel", item?: any) => {
    setMessages([]);
    setPeerTyping(false);
    if (type === "ai") {
      setIsAIChat(true);
      setSelectedUser(null);
      setSelectedChannel(null);
    } else if (type === "user") {
      // Find latest user data from state
      const freshUser = usersState.find(u => u.id === item.id) || item;
      setSelectedUser(freshUser);
      setSelectedChannel(null);
      setIsAIChat(false);
    } else if (type === "channel") {
      setSelectedChannel(item);
      setSelectedUser(null);
      setIsAIChat(false);
    }
    setShowChat(true);
  };

  // Robust Online Check: Presence OR recent Heartbeat (< 2 mins)
  const isUserOnline = (id: string) => {
    // Priority 1: Real-time Presence set
    if (onlineUserIds.has(id)) return true;

    // Priority 2: Recent Heartbeat (within 3 mins)
    const user = usersState.find(u => u.id === id);
    if (!user?.last_seen_at) return false;

    const lastSeen = new Date(user.last_seen_at).getTime();
    const now = getSyncedTime().getTime();
    const threeMinutes = 3 * 60 * 1000;

    return (now - lastSeen) < threeMinutes && user.online_status !== 'offline';
  };

  const getStatus = (id: string) => isUserOnline(id) ? "online" : "offline";

  // Sync selected user with real-time state
  const activeUser = selectedUser
    ? (usersState.find(u => u.id === selectedUser.id) || selectedUser)
    : null;

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <CallModal
        isOpen={showCallModal}
        onClose={handleEndCall}
        caller={incomingCaller
          ? { id: incomingCaller.id, name: incomingCaller.name, avatar_url: incomingCaller.avatar_url }
          : (selectedUser
            ? { id: selectedUser.id, name: selectedUser.full_name || selectedUser.email, avatar_url: selectedUser.avatar_url }
            : null)}
        isVideo={callType === "video"}
        isIncoming={!!incomingCaller}
        token={livekit.token}
        room={livekit.room}
        onAnswer={handleAnswerCall}
        onEnd={handleEndCall}
      />

      <div className="fixed inset-0 top-[56px] sm:top-[64px] bottom-[64px] md:bottom-0 md:relative md:inset-auto md:h-[calc(100vh-8rem)] flex bg-background rounded-none md:rounded-xl md:border shadow-sm overflow-hidden z-20">
        {/* Mobile */}
        <div className="w-full md:hidden">
          {showChat ? (
            <ChatView
              key={activeUser?.id || 'chat'}
              currentUser={currentUser}
              selectedUser={activeUser}
              selectedChannel={selectedChannel}
              isAIChat={isAIChat}
              messages={messages}
              aiMessages={aiMessages}
              newMessage={newMessage}
              aiTyping={aiTyping || peerTyping}
              isUploading={isUploading}
              onSendMessage={sendMessage}
              onNewMessageChange={handleTyping}
              onFileSelect={handleFileSelect}
              onCloseChat={() => setShowChat(false)}
              onStartCall={startCall}
              isOnline={!!(activeUser && isUserOnline(activeUser.id))}
              onViewContact={() => {
                if (activeUser) {
                  toast.info(`View profile: ${activeUser.full_name || activeUser.email}`);
                  // TODO: Implement profile view modal
                }
              }}
              onClearMessages={async () => {
                if (!selectedUser && !selectedChannel) return;
                if (confirm("Are you sure you want to clear this chat? This action cannot be undone.")) {
                  setMessages([]);
                  toast.success("Messages cleared");

                  try {
                    const { clearChatAction } = await import('@/app/dashboard/messages/actions');
                    await clearChatAction(
                      selectedUser ? selectedUser.id : selectedChannel!.id,
                      !!selectedChannel
                    );
                  } catch (e) {
                    console.error("Failed to clear chat:", e);
                  }
                }
              }}
              onMute={(muted) => {
                toast.success(muted ? "Notifications muted" : "Notifications unmuted");
                // TODO: Persist preference
              }}
            />
          ) : (
            <ListView
              currentUser={currentUser}
              users={usersState}
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
          <div className="w-80 lg:w-96 border-r shrink-0 overflow-hidden">
            <ListView
              currentUser={currentUser}
              users={usersState}
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
                key={activeUser?.id || 'chat'}
                currentUser={currentUser}
                selectedUser={activeUser}
                selectedChannel={selectedChannel}
                isAIChat={isAIChat}
                messages={messages}
                aiMessages={aiMessages}
                newMessage={newMessage}
                aiTyping={aiTyping || peerTyping}
                isUploading={isUploading}
                onSendMessage={sendMessage}
                onNewMessageChange={handleTyping}
                onFileSelect={handleFileSelect}
                onCloseChat={() => setShowChat(false)}
                onStartCall={startCall}
                isOnline={!!(activeUser && isUserOnline(activeUser.id))}
                onViewContact={() => {
                  if (activeUser) {
                    toast.info(`View profile: ${activeUser.full_name || activeUser.email}`);
                    // TODO: Implement profile view modal
                  }
                }}
                onClearMessages={async () => {
                  if (!selectedUser && !selectedChannel) return;
                  if (confirm("Are you sure you want to clear this chat? This action cannot be undone.")) {
                    setMessages([]);
                    toast.success("Messages cleared");

                    try {
                      const { clearChatAction } = await import('@/app/dashboard/messages/actions');
                      await clearChatAction(
                        selectedUser ? selectedUser.id : selectedChannel!.id,
                        !!selectedChannel
                      );
                    } catch (e) {
                      console.error("Failed to clear chat:", e);
                    }
                  }
                }}
                onMute={(muted) => {
                  toast.success(muted ? "Notifications muted" : "Notifications unmuted");
                  // TODO: Persist preference
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
