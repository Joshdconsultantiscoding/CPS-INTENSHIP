import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MessagesInterface } from "@/components/messages/messages-interface";

export const metadata = {
  title: "Messages",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const initialUserId = typeof params.user === "string" ? params.user : undefined;

  // Use Clerk auth instead of Supabase
  const authUser = await getAuthUser();
  const supabase = await createClient();

  // Build a user object compatible with the MessagesInterface
  const user = {
    id: authUser.id,
    email: authUser.email,
  };

  // Get profile and lists
  let profile = null;
  let users: any[] = [];
  let channels: any[] = [];
  let recentMessages: any[] = [];

  try {
    const [profileRes, usersRes, channelsRes, messagesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("profiles").select("id, full_name, email, avatar_url, role, online_status, last_seen_at").neq("id", user.id).order("full_name"),
      supabase.from("channels").select("*").order("created_at", { ascending: false }),
      supabase.from("messages").select("*, sender:profiles!messages_sender_id_fkey(*)").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).is("channel_id", null).order("created_at", { ascending: false }).limit(50),
    ]);

    profile = profileRes.data;
    users = usersRes.data || [];
    channels = channelsRes.data || [];
    recentMessages = messagesRes.data || [];
  } catch (err) {
    // Fail silently - we'll have empty lists but the UI won't crash
  }

  // Group messages by conversation partner
  type UserType = NonNullable<typeof users>[number];
  type MessageType = NonNullable<typeof recentMessages>[number];
  const conversations = new Map<string, { user: UserType; lastMessage: MessageType; unread: number }>();

  recentMessages?.forEach((msg) => {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    if (!partnerId) return;

    if (!conversations.has(partnerId)) {
      const partner = users?.find((u) => u.id === partnerId);
      if (partner) {
        conversations.set(partnerId, {
          user: partner,
          lastMessage: msg,
          unread: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
        });
      }
    } else if (msg.receiver_id === user.id && !msg.is_read) {
      const conv = conversations.get(partnerId)!;
      conv.unread++;
    }
  });

  return (
    <MessagesInterface
      currentUser={user}
      profile={profile}
      users={users || []}
      channels={channels || []}
      conversations={Array.from(conversations.values())}
      initialUserId={initialUserId}
    />
  );
}
