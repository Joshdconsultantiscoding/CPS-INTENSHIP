import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Calendar, Briefcase, Hash, Clock, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getAuthUser();
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">User not found</h2>
        <Link href="/dashboard/messages">
          <Button>Go Back</Button>
        </Link>
      </div>
    );
  }

  // Get stats if available (e.g. from a view or tasks table)
  // For now we just show basic profile info
  const isOwnProfile = user.id === userId;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link href="/dashboard/messages">
          <Button variant="ghost" gap="2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Messages
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <Card className="md:col-span-1 border-none shadow-lg bg-linear-to-b from-card to-muted/20">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl mb-4">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="text-4xl bg-muted text-muted-foreground">
                {profile.first_name?.[0] || profile.full_name?.[0] || profile.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold">{profile.full_name || "Unknown User"}</h1>
            <p className="text-muted-foreground mb-2">{profile.email}</p>
            <Badge variant="outline" className="capitalize mb-6 px-3 py-1">
              {profile.role}
            </Badge>

            <div className="w-full space-y-3 text-sm text-left px-2">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Briefcase className="h-4 w-4 text-primary" />
                <span className="truncate">{profile.department || "No department"}</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Clock className="h-4 w-4 text-primary" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              {profile.last_active_at && (
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Last active {new Date(profile.last_active_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {!isOwnProfile && (
              <div className="mt-8 w-full">
                <Link href={`/dashboard/messages?user=${profile.id}`}>
                  <Button className="w-full shadow-md" size="lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {profile.bio || "No bio information provided."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">First Name</p>
                  <p className="font-medium">{profile.first_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                  <p className="font-medium">{profile.last_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                  <p className="font-medium text-primary font-mono text-lg">{profile.total_points || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
