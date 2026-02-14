import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
    "/api/uploadthing(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const url = req.nextUrl;

    // 1. Run Supabase Session Update (for potential syncing/cookies)
    let response = await updateSession(req);

    // 2. Perform Suspension Check if user is logged in
    if (userId && !isPublicRoute(req)) {
        try {
            // Initialize Supabase Client (use Service Role for admin-level check in middleware)
            // If Service Role is not available, try Anon key (might hit RLS if not set up for Clerk yet)
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            const supabase = createClient(supabaseUrl, supabaseKey);

            const { data: profile } = await supabase
                .from('profiles')
                .select('account_status, role, documents_completed')
                .eq('id', userId)
                .single();

            // A. If Suspended -> Redirect to /suspended (unless already there)
            if (profile?.account_status === 'suspended') {
                if (!url.pathname.startsWith('/suspended')) {
                    return NextResponse.redirect(new URL('/suspended', req.url));
                }
                return response; // Stay on suspended page
            }

            // B. If NOT Suspended -> Block access to /suspended (redirect to dashboard)
            else if (url.pathname.startsWith('/suspended')) {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }

            // C. Mandatory Document Enforcement for Interns
            if (profile?.role === 'intern' && profile?.documents_completed === false) {
                const allowedPaths = [
                    '/dashboard/intern/complete-documents',
                    '/profile',
                    '/auth',
                    '/api'
                ];

                const isAllowed = allowedPaths.some(path => url.pathname.startsWith(path));

                if (!isAllowed && url.pathname !== '/') {
                    return NextResponse.redirect(new URL('/dashboard/intern/complete-documents', req.url));
                }
            }

        } catch (error) {
            console.error("Middleware Suspension Check Error:", error);
            // On error, we generally allow proceeding to avoid blocking all users if DB is down,
            // or we could block. Choosing to allow for now, but logging error.
        }
    }

    return response;
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|favicon.ico|.*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
