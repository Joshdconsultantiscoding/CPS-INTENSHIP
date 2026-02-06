import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getPosts, getNiches, getUserMembershipStatus } from "@/app/actions/community";
import { PostComposer } from "@/components/community/post-composer";
import { PostCard } from "@/components/community/post-card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NicheCommunityPage({ params }: { params: { nicheId: string } }) {
    const user = await getAuthUser();
    const { nicheId } = await params;

    if (!user) {
        redirect("/auth/sign-in");
    }

    const [nichesRes, postsRes, membershipRes] = await Promise.all([
        getNiches(),
        getPosts(50, 0, nicheId),
        getUserMembershipStatus()
    ]);

    const niche = nichesRes.niches.find(n => n.id === nicheId);
    if (!niche) {
        redirect("/dashboard/community");
    }

    // Security: Only allow members or admins
    const isMember = membershipRes.success && membershipRes.membership?.niche_id === nicheId;
    if (user.role === 'intern' && !isMember) {
        redirect("/dashboard/community");
    }

    const posts = postsRes.posts || [];
    const isAdmin = user.role === "admin";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {niche.name}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {niche.description}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex justify-center">
                <div className="w-full max-w-2xl space-y-4">
                    {/* Post Composer */}
                    <PostComposer
                        userId={user.id}
                        userAvatar={user.avatar_url}
                        userName={user.full_name}
                        isAdmin={isAdmin}
                        nicheId={nicheId}
                    />

                    {/* Feed */}
                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-card border rounded-xl">
                            <p className="text-muted-foreground">
                                No posts in {niche.name} yet. Be the first to share something!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={user.id}
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
