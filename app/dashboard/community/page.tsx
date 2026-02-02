import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getPosts } from "@/app/actions/community";
import { PostComposer } from "@/components/community/post-composer";
import { PostCard } from "@/components/community/post-card";

export default async function CommunityPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const { posts } = await getPosts(50, 0);

    const isAdmin = user.role === "admin";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Community</h1>
                <p className="text-muted-foreground">
                    Connect, share, and collaborate with your team
                </p>
            </div>

            {/* Main Content */}
            <div className="flex justify-center">
                <div className="w-full max-w-2xl space-y-4">
                    {/* Post Composer */}
                    <PostComposer
                        userId={user.id}
                        userAvatar={user.avatarUrl}
                        userName={user.name}
                        isAdmin={isAdmin}
                    />

                    {/* Feed */}
                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-card border rounded-xl">
                            <p className="text-muted-foreground">
                                No posts yet. Be the first to share something!
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
