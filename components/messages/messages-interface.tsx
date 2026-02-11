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
import { useNotificationSound } from "@/hooks/use-notification-sound";


import { MessagesStore } from "@/lib/messages-store";

interface MessagesInterfaceProps {
  currentUser: User;
  profile: Profile | null;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string;
    username?: string | null;
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


// WhatsApp-style status priority: never downgrade a message status
const STATUS_PRIORITY: Record<string, number> = { sending: 0, sent: 1, delivered: 2, read: 3 };
function higherStatus(a?: string, b?: string): string {
  const pa = STATUS_PRIORITY[a || "sent"] ?? 1;
  const pb = STATUS_PRIORITY[b || "sent"] ?? 1;
  return pa >= pb ? (a || "sent") : (b || "sent");
}

/** Merge server messages with current state. Returns prev if no meaningful changes. */
function mergeMessages(
  prev: Message[],
  fromServer: Message[],
  currentUserId: string,
  currentRecipientId: string | null,
  currentChannelId: string | null
): Message[] {
  // 1. Filter out invalid messages (no ID or empty ID)
  const validFromServer = fromServer.filter(m => m && m.id && String(m.id).trim() !== "");
  const validPrev = prev.filter(m => m && m.id && String(m.id).trim() !== "");

  const recentMs = 3 * 60 * 1000; // 3 mins window
  const now = Date.now();

  // 2. Create Map — merge with status priority (never downgrade)
  const messageMap = new Map<string, Message>();

  // Add all existing non-temp messages first
  validPrev.filter(m => !String(m.id).startsWith("temp-")).forEach(m => messageMap.set(String(m.id), m));

  // Merge incoming server messages, preserving higher status
  validFromServer.forEach(m => {
    const id = String(m.id);
    const existing = messageMap.get(id);
    if (existing) {
      // Keep the higher status between existing and incoming
      const bestStatus = higherStatus(existing.status, m.status);
      const bestIsRead = existing.is_read || m.is_read;
      messageMap.set(id, { ...m, status: bestStatus as any, is_read: bestIsRead });
    } else {
      messageMap.set(id, m);
    }
  });

  // 3. Process optimistic/temp messages
  const optimisticMessages = validPrev.filter(m => String(m.id).startsWith("temp-"));

  optimisticMessages.forEach(tempMsg => {
    const id = String(tempMsg.id);

    // CRITICAL DEDUPLICATION: Check if this temp message matches ANY real message already in the map
    const potentialMatch = Array.from(messageMap.values()).find(realMsg =>
      !String(realMsg.id).startsWith("temp-") &&
      realMsg.sender_id === tempMsg.sender_id &&
      String(realMsg.content).trim() === String(tempMsg.content).trim() &&
      Math.abs(new Date(realMsg.created_at).getTime() - new Date(tempMsg.created_at).getTime()) < 60000 // 60s window for server skew
    );

    if (potentialMatch) {
      // Replaced by real message - do NOT add temp message
      return;
    }

    // Also expire very old temp messages (> 3 mins) to prevent ghosts
    const created = tempMsg.created_at ? new Date(tempMsg.created_at).getTime() : 0;
    if (now - created > recentMs) return;

    messageMap.set(id, tempMsg);
  });

  // 4. STRICT FILTERING: Only keep messages belonging to the ACTIVE conversation
  // This is the primary defense against "data leakage" if the subscription is too broad.
  const filtered = Array.from(messageMap.values()).filter(m => {
    if (currentChannelId) {
      return m.channel_id === currentChannelId;
    }
    if (currentRecipientId) {
      // Message must be between ME and CURRENT PARTNER
      const isFromPartnerToMe = m.sender_id === currentRecipientId && m.recipient_id === currentUserId;
      const isFromMeToPartner = m.sender_id === currentUserId && m.recipient_id === currentRecipientId;
      // Must not be a channel message
      return (isFromPartnerToMe || isFromMeToPartner) && !m.channel_id;
    }
    return false;
  });

  // 5. Sort
  filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Optimization: Return prev ref if identical
  if (areMessagesEqual(prev, filtered)) {
    return prev;
  }

  return filtered;
}

export function MessagesInterface({
  currentUser,
  profile,
  users,
  channels,
  conversations: initialConversations,
  initialUserId,
}: MessagesInterfaceProps) {
  // --- Chat State ---
  const [usersState, setUsersState] = useState(users);
  const [conversationsState, setConversationsState] = useState(initialConversations);
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

  const { typing: typingUsers, recording: recordingUsers } = useUserActivity();

  // Fetch server-truth unread counts on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getConversationUnreadCountsAction } = await import("@/app/dashboard/messages/actions");
        const counts = await getConversationUnreadCountsAction();
        if (!cancelled && counts && typeof counts === "object") {
          setConversationsState(prev =>
            prev.map(c => {
              const serverCount = (counts as Record<string, number>)[c.user.id];
              if (typeof serverCount === "number") {
                return { ...c, unread: serverCount };
              }
              return c;
            })
          );
        }
      } catch (e) {
        console.warn("[MessagesInterface] Failed to fetch server unread counts:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Call State ---
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [incomingCaller, setIncomingCaller] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  const [callRoomName, setCallRoomName] = useState<string | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Media State ---
  const [isUploading, setIsUploading] = useState(false);

  // --- Pagination State ---
  const [hasMore, setHasMore] = useState(false);
  const [oldestMessageCursor, setOldestMessageCursor] = useState<string | null>(null);

  // Online dot: re-render every 10s
  const [, setPresenceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPresenceTick((c) => c + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const router = useRouter();
  const supabase = createClient();
  const { client: ably, isOffline, isConfigured } = useAbly();
  const livekit = useLiveKit();

  const ablyAvailable = !isOffline && isConfigured && ably && ably.connection?.state === 'connected';
  const { playSentSound, playReceivedSound } = useNotificationSound();
  const { getStatus: getUnifiedStatus } = useUnifiedPresence(usersState);
  const isUserOnline = useCallback((userId: string) => {
    return getUnifiedStatus(userId) === "online";
  }, [getUnifiedStatus]);

  // 1. Profile Updates
  useEffect(() => {
    const channel = supabase.channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const updated = payload.new as any;
        setUsersState(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
        if (selectedUser?.id === updated.id) {
          setSelectedUser(prev => prev ? ({ ...prev, ...updated } as any) : null);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, selectedUser?.id]);

  // 2. Global Notifications (Ably)
  useEffect(() => {
    if (!ablyAvailable || !ably) return;
    const notificationChannel = ably.channels.get(`user-notifications:${currentUser.id}`);

    const handleNewMessageNotification = (msg: any) => {
      const { senderId } = msg.data.metadata || {};
      if (!senderId) return;

      const partner = usersState.find(u => u.id === senderId);
      if (partner) {
        setConversationsState(prev => {
          const existing = prev.find(c => c.user.id === senderId);
          if (existing) {
            return prev.map(c => c.user.id === senderId ? { ...c, unread: (selectedUser?.id === senderId ? 0 : c.unread + 1) } : c);
          }
          return [...prev, { user: partner, lastMessage: { content: "New Message", created_at: new Date().toISOString() }, unread: 1 }];
        });
      }
    };

    notificationChannel.subscribe("message", handleNewMessageNotification);
    return () => { try { notificationChannel.unsubscribe("message", handleNewMessageNotification); } catch (e) { } };
  }, [ablyAvailable, ably, currentUser.id, usersState, selectedUser?.id]);

  // 3. Active Chat Ably Subscriptions
  useEffect(() => {
    if (!ablyAvailable || !ably || isAIChat || (!selectedUser && !selectedChannel)) return;

    const chatChannelName = selectedUser
      ? `chat:${[currentUser.id, selectedUser.id].sort().join("-")}`
      : `channel:${selectedChannel!.id}`;

    const chatChannel = ably.channels.get(chatChannelName);

    const messageHandler = (msg: any) => {
      const newMsg = msg.data as Message;
      setMessages((prev) => mergeMessages(prev, [newMsg], currentUser.id, selectedUser?.id || null, selectedChannel?.id || null));

      // Play received sound for incoming messages
      if (newMsg.sender_id !== currentUser.id) {
        playReceivedSound();
      }

      // Auto-mark as delivered if we received it through Ably
      if (newMsg.sender_id !== currentUser.id && newMsg.status === "sent") {
        chatChannel.publish("delivered-receipt", { messageIds: [newMsg.id], deliveredBy: currentUser.id }).catch(() => { });
      }
    };

    const typingHandler = (msg: any) => {
      if (msg.data?.userId !== currentUser.id) {
        setPeerTyping(msg.data.isTyping);
        if (msg.data.isTyping) {
          setTimeout(() => setPeerTyping(false), 3000);
        }
      }
    };

    const receiptHandler = (msg: any) => {
      const { messageIds, status } = msg.data;
      const byUser = msg.data.readBy || msg.data.deliveredBy;
      if (byUser !== currentUser.id && messageIds?.length > 0) {
        setMessages(prev => prev.map(m =>
          messageIds.includes(m.id) ? { ...m, status: status, is_read: status === "read" } : m
        ));
      }
    };

    chatChannel.subscribe("message", messageHandler);
    chatChannel.subscribe("typing", typingHandler);
    chatChannel.subscribe("read-receipt", (msg) => receiptHandler({ data: { ...msg.data, status: "read" } }));
    chatChannel.subscribe("delivered-receipt", (msg) => receiptHandler({ data: { ...msg.data, status: "delivered" } }));

    return () => {
      try {
        chatChannel.unsubscribe();
      } catch (e) { }
    };
  }, [ablyAvailable, ably, isAIChat, selectedUser, selectedChannel, currentUser.id]);

  // 4. Supabase Fetch & Mark Delivered (OFFLINE-FIRST)
  const currentChatRef = useRef<string | null>(null);
  useEffect(() => {
    if (isAIChat || (!selectedUser && !selectedChannel)) return;

    const chatId = selectedUser?.id || selectedChannel?.id || "";
    if (!chatId) return;

    // 1. Reset state (show nothing until cache or fetch updates)
    if (currentChatRef.current !== chatId) {
      currentChatRef.current = chatId;
      setMessages([]);
      setHasMore(false);
      setOldestMessageCursor(null);

      // 2. INSTANT CACHE LOAD
      MessagesStore.getMessages(currentUser.id, chatId).then((cached) => {
        if (currentChatRef.current === chatId && cached.length > 0) {
          console.log(`[MessagesInterface] Instant load ${cached.length} messages from cache`);
          setMessages(cached);
        }
      });
    }

    const initChat = async () => {
      const { getMessagesAction, markDeliveredAction } = await import("@/app/dashboard/messages/actions");

      // 3. BACKGROUND SYNC (Fetch fresh from server)
      const res = await getMessagesAction(selectedUser?.id ?? null, selectedChannel?.id ?? null, 50, null);
      if (!res.success || !res.data) return;

      setHasMore(!!res.nextCursor);
      setOldestMessageCursor(res.nextCursor);

      const normalized = res.data.map((m: any) => ({
        ...m,
        status: m.status || (m.is_read ? "read" : "sent"),
      }));

      // 4. MERGE & PERSIST
      setMessages(prev => {
        const merged = mergeMessages(prev, normalized, currentUser.id, selectedUser?.id || null, selectedChannel?.id || null);

        // Update Cache in background
        MessagesStore.saveMessages(currentUser.id, chatId, merged);

        return merged;
      });

      // 5. READ RECEIPT & DELIVERED LOGIC (Background)
      const toMarkDelivered = normalized.filter(
        (m: any) => m.recipient_id === currentUser.id && m.status === "sent"
      ).map((m: any) => m.id);

      if (toMarkDelivered.length > 0) {
        markDeliveredAction(toMarkDelivered).catch(() => { });
        if (ably && selectedUser) {
          const chatChannelName = `chat:${[currentUser.id, selectedUser.id].sort().join("-")}`;
          ably.channels.get(chatChannelName).publish("delivered-receipt", { messageIds: toMarkDelivered, deliveredBy: currentUser.id }).catch(() => { });
        }
      }

      const unread = normalized.filter((m: any) => m.sender_id !== currentUser.id && !m.is_read).map((m: any) => m.id);
      if (unread.length > 0) {
        supabase.from("messages").update({ is_read: true, status: "read", read_at: new Date().toISOString() }).in("id", unread).then(() => { });
        if (ably && selectedUser) {
          const chatChannelName = `chat:${[currentUser.id, selectedUser.id].sort().join("-")}`;
          ably.channels.get(chatChannelName).publish("read-receipt", { messageIds: unread, readBy: currentUser.id }).catch(() => { });
        }
      }
    };

    // Delay slighty to allow cache render first
    setTimeout(initChat, 10);

  }, [selectedUser?.id, selectedChannel?.id, isAIChat, currentUser.id]);

  // Persist messages on change (Debounced slightly preferred but direct is okay for now as set is async)
  useEffect(() => {
    if (!messages.length || isAIChat) return;
    const chatId = selectedUser?.id || selectedChannel?.id;
    if (chatId) {
      MessagesStore.saveMessages(currentUser.id, chatId, messages);
    }
  }, [messages, selectedUser?.id, selectedChannel?.id, isAIChat, currentUser.id]);

  const handleLoadMore = async () => {
    if (!hasMore || !oldestMessageCursor) return;
    const { getMessagesAction } = await import("@/app/dashboard/messages/actions");
    const res = await getMessagesAction(selectedUser?.id ?? null, selectedChannel?.id ?? null, 50, oldestMessageCursor);

    if (res.success && res.data) {
      const normalized = res.data.map((m: any) => ({
        ...m,
        status: m.status || (m.is_read ? "read" : "sent"),
      }));
      setMessages(prev => mergeMessages(prev, normalized, currentUser.id, selectedUser?.id || null, selectedChannel?.id || null));

      setHasMore(!!res.nextCursor);
      setOldestMessageCursor(res.nextCursor);
    } else {
      setHasMore(false);
    }
  };


  // AI & Calls placeholders
  useEffect(() => {
    if (initialUserId) {
      const u = users.find(u => u.id === initialUserId);
      if (u) { setSelectedUser(u); setSelectedChannel(null); setIsAIChat(false); setShowChat(true); }
    }
  }, [initialUserId, users]);

  // Signaling for calls
  useEffect(() => {
    if (!ably || !isConfigured || ably.connection.state !== 'connected') return;
    const userChannel = ably.channels.get(`user-notifications:${currentUser.id}`);

    const incomingCallHandler = (msg: any) => {
      setIncomingCaller(msg.data.caller);
      setCallType(msg.data.type);
      setCallRoomName(msg.data.roomName);
      setShowCallModal(true);
    };

    const callEndedHandler = () => {
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
      setShowCallModal(false);
      setIncomingCaller(null);
      setCallRoomName(null);
      livekit.disconnect();
      toast.info("Call ended");
    };

    const callRejectedHandler = () => {
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
      setShowCallModal(false);
      setIncomingCaller(null);
      setCallRoomName(null);
      livekit.disconnect();
      toast.info("Call was rejected");
    };

    userChannel.subscribe("incoming-call", incomingCallHandler);
    userChannel.subscribe("call-ended", callEndedHandler);
    userChannel.subscribe("call-rejected", callRejectedHandler);

    return () => { try { userChannel.unsubscribe(); } catch (e) { } };
  }, [ably, currentUser.id, livekit, isConfigured]);

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

    const roomName = `room-${[currentUser.id, selectedUser.id].sort().join("-")}-${Math.floor(Date.now() / 60000)}`;
    setCallType(type);
    setCallRoomName(roomName);
    setIncomingCaller(null);
    setShowCallModal(true);

    // 1. Notify the target user IMMEDIATELY (Signaling First)
    if (ably) {
      console.log(`[MessagesInterface] Attempting to notify user ${selectedUser.id} of incoming call`);
      try {
        const notifyChannel = ably.channels.get(`user-notifications:${selectedUser.id}`);
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

    // 2. Auto-timeout: if no answer within 30s, end call as missed
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = setTimeout(() => {
      console.log("[MessagesInterface] Call auto-timeout (30s, no answer)");
      handleEndCall(0, false);
    }, 30000);

    // 3. Then attempt to join room (Media Second)
    try {
      await livekit.connect(roomName, profile?.full_name || currentUser.email || "User");
    } catch (e) {
      console.error("Failed to connect to LiveKit:", e);
      toast.error("Media connection failed, signaling sent.");
    }
  };

  const handleAnswerCall = async () => {
    // Clear auto-timeout on answer
    if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }

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
    const finalDuration = typeof durationOrProxy === 'number' ? durationOrProxy : 0;
    const finalConnected = typeof wasConnected === 'boolean' ? wasConnected : false;

    console.log(`[MessagesInterface] handleEndCall: duration=${finalDuration}, connected=${finalConnected}`);

    // Clear auto-timeout
    if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }

    // Guard: Prevent double execution if already cleaning up
    if (!showCallModal && !callRoomName) {
      console.log("[MessagesInterface] handleEndCall skipped (already closing)");
      return;
    }

    const isInitiator = !incomingCaller;
    const targetUserId = incomingCaller?.id || selectedUser?.id;

    console.log(`[MessagesInterface] End Call Sync: isInitiator=${isInitiator}, target=${targetUserId}`);

    // Disconnect from LiveKit FIRST
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

    // Log the call in chat history + call_logs table
    if (isInitiator && targetUserId) {
      const callStatus = finalConnected ? "completed" : "missed";
      const callDuration = finalConnected
        ? `${String(Math.floor(finalDuration / 60)).padStart(2, "0")}:${String(finalDuration % 60).padStart(2, "0")}`
        : "00:00";

      try {
        const { sendCallLogAction, createCallLogAction } = await import("@/app/dashboard/messages/actions");
        // 1. Chat message log
        await sendCallLogAction(targetUserId, callType, callStatus, callDuration);
        // 2. Dedicated call_logs table (fails silently if table missing)
        await createCallLogAction(targetUserId, callType, callStatus, finalDuration);
      } catch (e) {
        console.error("[MessagesInterface] Call log persistence failed:", e);
      }
    }

    setShowCallModal(false);
    setIncomingCaller(null);
    setCallRoomName(null);
  };

  // Reject incoming call (for the receiver)
  const handleRejectCall = async () => {
    // Clear auto-timeout
    if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }

    const callerId = incomingCaller?.id;

    // Disconnect from LiveKit
    try {
      await livekit.disconnect();
    } catch (e) {
      console.warn("[MessagesInterface] Disconnect error on reject:", e);
    }

    // Notify caller that call was rejected
    if (callerId && ably) {
      try {
        const notifyChannel = ably.channels.get(`user-notifications:${callerId}`);
        await notifyChannel.publish("call-rejected", { rejectedBy: currentUser.id });
      } catch (e) {
        console.warn("[MessagesInterface] Failed to notify caller of rejection:", e);
      }
    }

    // Log the rejected call (from receiver's perspective, log under caller's name)
    if (callerId) {
      try {
        const { sendCallLogAction } = await import("@/app/dashboard/messages/actions");
        await sendCallLogAction(callerId, callType, "rejected", "00:00");
      } catch (e) {
        console.error("[MessagesInterface] Rejected call log failed:", e);
      }
    }

    setShowCallModal(false);
    setIncomingCaller(null);
    setCallRoomName(null);
    toast.info("Call rejected");
  };

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

      // Simulate AI thinking delay (like the AI assistant page)
      setTimeout(async () => {
        const response = generateResponse(content);
        const aiMsgId = `ai-${Date.now()}`;

        // Add AI message with streaming content (character by character like AI assistant page)
        setAiMessages((prev) => [...prev, {
          id: aiMsgId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          status: "read"
        }]);

        // Turn off typing indicator once message bubble appears
        setAiTyping(false);

        // Stream the response character-by-character (smooth like AI assistant page)
        for (let i = 0; i <= response.length; i++) {
          const partialText = response.slice(0, i);
          setAiMessages((prev) => prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: partialText } : m
          ));
          // Fast streaming speed (similar to real AI streaming)
          await new Promise((r) => setTimeout(r, 15));
        }
      }, 800); // Initial thinking delay
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

        // Replace optimistic with real message — status = "sent" (single grey tick ✓)
        const realMsg = { ...data, status: "sent", sender: profile as any };
        setMessages(prev => {
          // If the real message already exists in state (via realtime/Ably), just remove the temp one
          if (prev.some(m => String(m.id) === String(data.id))) {
            return prev.filter(m => m.id !== tempId);
          }
          // Otherwise replace the temp one with status="sent"
          return prev.map(m => m.id === tempId ? realMsg : m);
        });

        // Play sent notification sound
        playSentSound();

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
  const handleTyping = async (valueOrIsTyping: string | boolean) => {
    const isExplicitStop = valueOrIsTyping === false;
    const value = typeof valueOrIsTyping === "string" ? valueOrIsTyping : newMessage;

    if (typeof valueOrIsTyping === "string") {
      setNewMessage(value);
    }

    if (!selectedUser && !selectedChannel) return;

    // 1. Explicit STOP Typing
    if (isExplicitStop) {
      setIsTyping(false);
      broadcastTyping(false);
      return;
    }

    // 2. Start Typing (Throttled)
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      broadcastTyping(true);

      // Auto-stop after 3s if no new input (fallback)
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  const broadcastTyping = async (isTypingState: boolean) => {
    // Broadcast Global Typing via Ably
    if (ablyAvailable && ably) {
      // 1. Publish to specific chat channel so the other user sees it immediately
      const chatChannelName = selectedUser
        ? `chat:${[currentUser.id, selectedUser.id].sort().join("-")}`
        : `channel:${selectedChannel!.id}`;

      ably.channels.get(chatChannelName).publish('typing', {
        userId: currentUser.id,
        isTyping: isTypingState
      }).catch(err => console.error("Failed to broadcast chat typing:", err));

      // 2. Publish to global activity (optional, for lists)
      if (selectedUser) {
        ably.channels.get('global-activity').publish('typing', {
          userId: currentUser.id,
          targetUserId: selectedUser.id,
          isTyping: isTypingState
        }).catch(err => console.error("Failed to broadcast global typing:", err));
      }
    }

    // Supabase Realtime typing broadcast removed — Ably handles typing exclusively
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
    // Determine Target ID
    let targetId = "";
    if (type === "ai") targetId = "ai";
    else if (type === "user") targetId = item.id;
    else if (type === "channel") targetId = item.id;

    // Determine Current ID
    let currentId = "";
    if (isAIChat) currentId = "ai";
    else if (selectedUser) currentId = selectedUser.id;
    else if (selectedChannel) currentId = selectedChannel.id;

    // Only clear messages if we are switching to a DIFFERENT chat
    if (targetId !== currentId) {
      setMessages([]);
      setPeerTyping(false);
    } else {
      console.log("[MessagesInterface] Re-opening same chat, preserving messages");
    }

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
      // Clear unread badge immediately on open
      setConversationsState(prev =>
        prev.map(c => c.user.id === item.id ? { ...c, unread: 0 } : c)
      );
    } else if (type === "channel") {
      setSelectedChannel(item);
      setSelectedUser(null);
      setIsAIChat(false);
    }
    setShowChat(true);
  };

  // Online dot: if now - last_active_at < 10s → online, else offline (updates every 2s via presenceTick)


  const getStatus = (id: string) => getUnifiedStatus(id);

  // Sync selected user with real-time state
  // Sync selected user with real-time state
  const activeUser = selectedUser
    ? (usersState.find(u => u.id === selectedUser.id) || selectedUser)
    : null;

  // CRITICAL: Force clear unread when activeUser changes
  useEffect(() => {
    if (activeUser) {
      setConversationsState(prev =>
        prev.map(c => c.user.id === activeUser.id ? { ...c, unread: 0 } : c)
      );
    }
  }, [activeUser?.id]);

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
        serverUrl={livekit.serverUrl}
        onAnswer={handleAnswerCall}
        onEnd={handleEndCall}
        onReject={handleRejectCall}
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
              messages={messages.filter(m => {
                if (isAIChat) return true;
                if (selectedChannel) return m.channel_id === selectedChannel.id;
                if (activeUser) {
                  return (m.sender_id === activeUser.id || m.recipient_id === activeUser.id) && !m.channel_id;
                }
                return false;
              })}
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
              presenceStatus={activeUser ? (getUnifiedStatus(activeUser.id) as "online" | "idle" | "offline") : "offline"}
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
              conversations={conversationsState}
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
              conversations={conversationsState}
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
                messages={messages.filter(m => {
                  // PARANOID CHECK: Ensure message belongs to this chat
                  if (isAIChat) return true; // AI handled separately
                  if (selectedChannel) return m.channel_id === selectedChannel.id;
                  if (activeUser) {
                    return (m.sender_id === activeUser.id || m.recipient_id === activeUser.id) && !m.channel_id;
                  }
                  return false;
                })}
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
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isOnline={!!(activeUser && isUserOnline(activeUser.id))}
                presenceStatus={activeUser ? (getUnifiedStatus(activeUser.id) as "online" | "idle" | "offline") : "offline"}
                onViewContact={() => {
                  if (activeUser) router.push(`/profile/${activeUser.username || activeUser.id}`);
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
