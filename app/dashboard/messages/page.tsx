import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
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

  // Enforce access control — ensures blocked routes are handled gracefully
  const { enforceAccess } = await import("@/lib/middleware/access-guard");
  const access = await enforceAccess(authUser.id, "/dashboard/messages");

  if (!access.allowed) {
    const { BlockedRouteView } = await import("@/components/dashboard/blocked-route-view");
    return (
      <BlockedRouteView
        reason={access.reason || "Access to messaging has been restricted by an administrator."}
        route="/dashboard/messages"
        routeName="Messages"
      />
    );
  }

  // Use admin client to bypass RLS — ensures all users are visible (admin, mentor, intern)
  const supabase = await createAdminClient();

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
      supabase.from("profiles").select("id, full_name, first_name, last_name, email, username, avatar_url, role, online_status, last_seen_at, last_active_at").neq("id", user.id).order("full_name"),
      supabase.from("channels").select("*").order("created_at", { ascending: false }),
      supabase.from("messages").select("*").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).is("channel_id", null).order("created_at", { ascending: false }).limit(50),
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
    const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
    if (!partnerId) return;

    if (!conversations.has(partnerId)) {
      const partner = users?.find((u) => u.id === partnerId);
      if (partner) {
        conversations.set(partnerId, {
          user: partner,
          lastMessage: msg,
          unread: msg.recipient_id === user.id && !msg.is_read ? 1 : 0,
        });
      }
    } else if (msg.recipient_id === user.id && !msg.is_read) {
      const conv = conversations.get(partnerId)!;
      conv.unread++;
    }
  });

  return (
    <MessagesInterface
      currentUser={user as any}
      profile={profile}
      users={users || []}
      channels={channels || []}
      conversations={Array.from(conversations.values())}
      initialUserId={initialUserId}
    />
  );
}
