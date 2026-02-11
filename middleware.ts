import { clerkMiddleware } from '@clerk/nextjs/server';

import { updateSession } from "@/lib/supabase/middleware";

export default clerkMiddleware(async (auth, req) => {
    return await updateSession(req);
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|favicon.ico|.*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
