"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile, Message, Channel } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { OnlineIndicator } from "./online-indicator";
import { Loader2, Plus, X } from "lucide-react";
import { CallModal } from "./call-modal";
import { ChatView } from "./chat-view";
import { ListView } from "./list-view";
import { useAbly, useUnifiedPresence, useUserActivity } from "@/providers/ably-provider";
import { useLiveKit } from "@/hooks/use-livekit";
import { generateResponse } from "@/lib/hg-core-knowledge";

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
    last_active_at?: string | null;
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

// Helper for deep comparison of message arrays
function areMessagesEqual(a: Message[], b: Message[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].status !== b[i].status) return false;
    if (a[i].is_read !== b[i].is_read) return false;
    if (a[i].content !== b[i].content) return false;
  }
  return true;
}



/** Merge server messages with current state. Returns prev if no meaningful changes. */
function mergeMessages(
  prev: Message[],
  fromServer: Message[],
  currentUserId: string,
  currentRecipientId: string | null,
  currentChannelId: string | null
): Message[] {
  // 1. Filter out invalid messages (no ID or empty ID) - Fixes "same key ``" error
  const validFromServer = fromServer.filter(m => m && m.id && String(m.id).trim() !== "");
  const validPrev = prev.filter(m => m && m.id && String(m.id).trim() !== "");

  const recentMs = 2 * 60 * 1000;
  const now = Date.now();

  // 2. Create Map for authoritative messages (server wins)
  const messageMap = new Map<string, Message>();
  validFromServer.forEach(m => messageMap.set(String(m.id), m));

  // 3. Process previous messages (Optimistic/Temp)
  validPrev.forEach(m => {
    const id = String(m.id);

    // If server already provided this message, skip the local/stale version
    if (messageMap.has(id)) return;

    // Filter out messages not relevant to the current conversation
    if (currentRecipientId && m.recipient_id !== currentRecipientId) return; // DM safety
    if (currentChannelId && m.channel_id !== currentChannelId) return; // Channel safety
    if (m.sender_id === currentUserId && m.recipient_id !== currentRecipientId && !currentChannelId) return; // Self-sent check

    // HEURISTIC: Deduplicate Temp vs Real
    // If 'm' is a temp message, check if we have a matching real message in `validFromServer`
    if (id.startsWith("temp-")) {
      const isReplaced = validFromServer.some(realMsg =>
        realMsg.sender_id === m.sender_id &&
        realMsg.content === m.content &&
        Math.abs(new Date(realMsg.created_at).getTime() - new Date(m.created_at).getTime()) < 10000 // 10s window
      );
      if (isReplaced) return; // Don't add temp message, it's effectively replaced/delivered

      // Also expire very old temp messages (> 2 mins) to prevents ghosts
      const created = m.created_at ? new Date(m.created_at).getTime() : 0;
      if (now - created > recentMs) return;
    }

    messageMap.set(id, m);
  });

  // 4. Convert and Sort
  const combined = Array.from(messageMap.values());
  combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Optimization: Return prev ref if identical
  if (areMessagesEqual(prev, combined)) {
    return prev;
  }

  return combined;
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
  // Use global online users context from Ably provider (single source of truth)
  // Use global online users context from Ably provider (single source of truth)
  // const globalOnlineUsers = useOnlineUsers(); // Replaced by useUnifiedPresence
  const { typing: typingUsers, recording: recordingUsers } = useUserActivity();

  // Call State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [incomingCaller, setIncomingCaller] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  const [callRoomName, setCallRoomName] = useState<string | null>(null);

  // Media State
  const [isUploading, setIsUploading] = useState(false);

  // Online dot: re-render every 2s so last_active_at-based online status updates
  const [, setPresenceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPresenceTick((c) => c + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const router = useRouter();
  const supabase = createClient();
  const { client: ably, isOffline, isConfigured } = useAbly(); // Removed unused status
  const livekit = useLiveKit();

  // Check if Ably is available and connected
  const ablyAvailable = !isOffline && isConfigured && ably && ably.connection?.state === 'connected';

  // Use unified presence hook (Ably + DB Fallback)
  const { getStatus: getUnifiedStatus } = useUnifiedPresence(usersState);

  // Helper: Check if user is online based on unified status
  const isUserOnline = useCallback((userId: string) => {
    return getUnifiedStatus(userId) === "online";
  }, [getUnifiedStatus]);

  // ============================================
  // PRESENCE: Now using global Ably context
  // The Supabase presence channel is no longer needed since ably-provider.tsx
  // handles presence tracking and exposes it via useOnlineUsers hook.
  // This keeps presence consistent across all pages.
  // ============================================

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
    fetchUsers(); // Fetch immediately on mount
    const interval = setInterval(fetchUsers, 120000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [supabase, selectedUser?.id]);

  // ============================================
  // DATABASE PRESENCE & LAST SEEN
  // ============================================
  // Handled by AblyProvider via GlobalPresenceTracker
  // No need for duplicate updates here.


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
        setMessages((prev) => mergeMessages(prev, [newMsg], currentUser.id, selectedUser?.id || null, selectedChannel?.id || null));
      };

      // Subscribe to typing indicators
      const typingHandler = (msg: any) => {
        if (msg.data?.userId !== currentUser.id) {
          setPeerTyping(true);
          setTimeout(() => setPeerTyping(false), 2500);
        }
      };

      // Subscribe to read receipts to update sender's message status
      const readReceiptHandler = (msg: any) => {
        const { messageIds, readBy } = msg.data;
        if (readBy !== currentUser.id && messageIds?.length > 0) {
          setMessages(prev => prev.map(m =>
            messageIds.includes(m.id) ? { ...m, is_read: true, status: "read" } : m
          ));
        }
      };

      chatChannel.subscribe("message", messageHandler);
      chatChannel.subscribe("typing", typingHandler);
      chatChannel.subscribe("read-receipt", readReceiptHandler);

      return () => {
        try {
          chatChannel.unsubscribe("message", messageHandler);
          chatChannel.unsubscribe("typing", typingHandler);
          chatChannel.unsubscribe("read-receipt", readReceiptHandler);
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
    // Clear messages when switching contexts to prevent bleed-over
    setMessages([]);

    if (isAIChat || (!selectedUser && !selectedChannel)) return;

    const fetchMessages = async () => {
      const { getMessagesAction, markDeliveredAction } = await import("@/app/dashboard/messages/actions");
      const res = await getMessagesAction(selectedUser?.id ?? null, selectedChannel?.id ?? null);
      if (!res.success || !res.data) return;

      const toMarkDelivered = res.data.filter(
        (m: any) => m.recipient_id === currentUser.id && m.status === "sent"
      ).map((m: any) => m.id);
      if (toMarkDelivered.length > 0) {
        await markDeliveredAction(toMarkDelivered);
      }
      const deliveredSet = new Set(toMarkDelivered);
      const nowIso = new Date().toISOString();
      const enriched = res.data.map((m: any) =>
        deliveredSet.has(m.id) ? { ...m, status: "delivered", delivered_at: nowIso } : m
      );
      setMessages((prev) => mergeMessages(prev, enriched, currentUser.id, selectedUser?.id || null, selectedChannel?.id || null));

      // Mark unread incoming messages as read
      const unreadFromOther = res.data.filter(
        (m: any) => m.sender_id !== currentUser.id && !m.is_read
      );
      if (unreadFromOther.length > 0) {
        const ids = unreadFromOther.map((m: any) => m.id);
        await supabase
          .from("messages")
          .update({ is_read: true, read_at: new Date().toISOString(), status: "read" })
          .in("id", ids);

        if (ablyAvailable && ably && selectedUser) {
          const receiptChannel = ably.channels.get(`chat:${[currentUser.id, selectedUser.id].sort().join("-")}`);
          receiptChannel.publish("read-receipt", { messageIds: ids, readBy: currentUser.id }).catch(() => { });
        }
      }
    };

    const updatePresence = async () => {
      const { data } = await supabase.from("profiles").select("id, last_active_at, last_seen_at");
      if (!data) return;
      setUsersState((prev) => {
        const map = new Map(data.map((r: any) => [r.id, { last_active_at: r.last_active_at, last_seen_at: r.last_seen_at }]));
        return prev.map((u) => {
          const upd = map.get(u.id);
          return upd ? { ...u, ...upd } : u;
        });
      });
    };

    fetchMessages();
    updatePresence();

    const msgInterval = setInterval(fetchMessages, 2000);
    const presInterval = setInterval(updatePresence, 2000);

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
        const newRow = payload.new;
        const isRelevant = selectedUser
          ? (newRow.sender_id === currentUser.id && newRow.recipient_id === selectedUser.id) ||
          (newRow.sender_id === selectedUser.id && newRow.recipient_id === currentUser.id)
          : newRow.channel_id === selectedChannel?.id;

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

        setMessages((prev) => mergeMessages(prev, [newMsg], currentUser.id, selectedUser?.id || null, selectedChannel?.id || null));
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (payload.userId !== currentUser.id) {
          setPeerTyping(true);
          setTimeout(() => setPeerTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      clearInterval(msgInterval);
      clearInterval(presInterval);
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

    // Log the call in chat history (Only for the initiator) – structured call message
    if (isInitiator && targetUserId) {
      try {
        const { sendCallLogAction } = await import("@/app/dashboard/messages/actions");
        const callStatus = finalConnected ? "completed" : "missed";
        const callDuration = finalConnected
          ? `${String(Math.floor(finalDuration / 60)).padStart(2, "0")}:${String(finalDuration % 60).padStart(2, "0")}`
          : "00:00";
        const res = await sendCallLogAction(targetUserId, callType, callStatus, callDuration);
        if (!res.success) throw new Error(res.error);
      } catch (e) {
        console.error("[MessagesInterface] Call log persistence failed:", e);
        try {
          const { sendMessageAction } = await import("@/app/dashboard/messages/actions");
          await sendMessageAction(`[CALL_LOG]:${callType}:${finalConnected ? finalDuration : "missed"}`, targetUserId, null);
        } catch (fallback) {
          console.error("[MessagesInterface] Call log fallback failed:", fallback);
        }
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
      const url = data.secure_url ?? data.fileUrl ?? data.url;
      if (!url) throw new Error("No file URL returned");
      await sendMessage(undefined, url);
      toast.success("Sent successfully", { id: toastId });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed: " + error.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendAttachment = async (file: File, caption: string) => {
    if (!selectedUser && !selectedChannel) return;
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_SIZE_MB}MB.`);
      return;
    }
    setIsUploading(true);
    const toastId = toast.loading("Uploading...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      const url = data.secure_url ?? data.fileUrl ?? data.url;
      if (!url) throw new Error("No file URL returned");
      await sendMessage(undefined, url, caption.trim());
      toast.success("Sent", { id: toastId });
    } catch (error: any) {
      toast.error("Upload failed: " + error.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================
  // SEND MESSAGE
  // ============================================
  const sendMessage = async (e?: React.FormEvent, attachmentUrl?: string, contentOverride?: string) => {
    if (e) e.preventDefault();
    const content = contentOverride ?? newMessage.trim();
    if (!content && !attachmentUrl) return;

    if (contentOverride === undefined) setNewMessage("");

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

      // Broadcast Global Typing via Ably
      if (ablyAvailable) {
        // 1. Publish to specific chat channel so the other user sees it immediately
        const chatChannelName = selectedUser
          ? `chat:${[currentUser.id, selectedUser.id].sort().join("-")}`
          : `channel:${selectedChannel!.id}`;

        ably?.channels.get(chatChannelName).publish('typing', {
          userId: currentUser.id,
          isTyping: true
        }).catch(err => console.error("Failed to broadcast chat typing:", err));

        // 2. Publish to global activity (optional, for lists)
        if (selectedUser) {
          ably?.channels.get('global-activity').publish('typing', {
            userId: currentUser.id,
            targetUserId: selectedUser.id,
            isTyping: true
          }).catch(err => console.error("Failed to broadcast global typing:", err));
        }
      }

      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const handleRecordingStart = () => {
    if (ablyAvailable && selectedUser) {
      ably?.channels.get('global-activity').publish('recording', {
        userId: currentUser.id,
        targetUserId: selectedUser.id,
        isRecording: true
      }).catch(console.error);
    }
  };

  const handleRecordingEnd = () => {
    if (ablyAvailable && selectedUser) {
      ably?.channels.get('global-activity').publish('recording', {
        userId: currentUser.id,
        targetUserId: selectedUser.id,
        isRecording: false
      }).catch(console.error);
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

  // Online dot: if now - last_active_at < 10s → online, else offline (updates every 2s via presenceTick)


  const getStatus = (id: string) => (isUserOnline(id) ? "online" : "offline");

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
          ? { id: incomingCaller.id, name: incomingCaller.name, avatar_url: incomingCaller.avatar_url ?? undefined }
          : (selectedUser
            ? { id: selectedUser.id, name: selectedUser.full_name || selectedUser.email, avatar_url: selectedUser.avatar_url ?? undefined }
            : null)}
        isVideo={callType === "video"}
        isIncoming={!!incomingCaller}
        token={livekit.token}
        room={livekit.room}
        onAnswer={handleAnswerCall}
        onEnd={handleEndCall}
      />

      <div className="fixed inset-0 top-[56px] sm:top-[64px] bottom-[64px] md:bottom-0 md:relative md:inset-auto md:h-[calc(100dvh-8rem)] flex bg-background rounded-none md:rounded-xl md:border shadow-sm overflow-hidden z-20">
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
              onSendAttachment={handleSendAttachment}
              onCloseChat={() => setShowChat(false)}
              onStartCall={startCall}
              isOnline={!!(activeUser && isUserOnline(activeUser.id))}
              onViewContact={() => {
                if (activeUser) router.push(`/dashboard/profile/${activeUser.id}`);
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
              typingUsers={typingUsers}
              recordingUsers={recordingUsers}
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
              typingUsers={typingUsers}
              recordingUsers={recordingUsers}
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
                onSendAttachment={handleSendAttachment}
                onCloseChat={() => setShowChat(false)}
                onStartCall={startCall}
                isOnline={!!(activeUser && isUserOnline(activeUser.id))}
                onViewContact={() => {
                  if (activeUser) router.push(`/dashboard/profile/${activeUser.id}`);
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
