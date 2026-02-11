import { NextRequest, NextResponse } from "next/server";

// ============================================================
// SET-INTENT API — Stores portal intent as an HTTP cookie
// This is a NEW route. Does NOT modify any existing code.
// The cookie allows server components to read the intent.
// ============================================================

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const intent = searchParams.get("intent");

        if (!intent) {
            return NextResponse.json(
                { error: "Missing intent parameter" },
                { status: 400 }
            );
        }

        // Validate intent value
        const validIntents = [
            "admin",
            "mentor",
            "company",
            "recruiter",
            "intern",
            "marketplace",
            "ai",
        ];

        if (!validIntents.includes(intent)) {
            return NextResponse.json(
                { error: "Invalid intent value" },
                { status: 400 }
            );
        }

        const response = NextResponse.json({ success: true, intent });

        // Set cookie — expires in 1 hour (enough time to complete sign-up)
        response.cookies.set("portal_intent", intent, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 3600, // 1 hour
            path: "/",
        });

        return response;
    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
