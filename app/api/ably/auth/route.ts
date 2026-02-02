import Ably from "ably";
import { NextResponse } from "next/server";
import { getAuthUserOptional } from "@/lib/auth";

export async function GET(request: Request) {
    // Fast-fail if Ably is not configured
    if (!process.env.ABLY_API_KEY) {
        console.warn("Ably API key not configured - real-time features disabled");
        return NextResponse.json(
            {
                error: "Real-time service not configured",
                code: "ABLY_NOT_CONFIGURED",
                recoverable: false
            },
            {
                status: 503,
                headers: {
                    "Retry-After": "3600", // Tell client to wait 1 hour
                    "Cache-Control": "no-store"
                }
            }
        );
    }

    try {
        // Use optional auth to avoid redirect loops
        const user = await getAuthUserOptional();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        const client = new Ably.Rest(process.env.ABLY_API_KEY);
        const tokenParams = { clientId: String(user.id) };
        const tokenRequest = await client.auth.createTokenRequest(tokenParams);

        console.log(`Ably Token Request generated for user: ${user.id}`);

        return NextResponse.json(tokenRequest, {
            headers: {
                "Cache-Control": "no-store",
            }
        });
    } catch (error: any) {
        console.error("Ably Auth Error:", error);

        // Check for network-related errors
        const isNetworkError = error.code === 'ENOTFOUND' ||
            error.code === 'ECONNREFUSED' ||
            error.message?.includes('network');

        return NextResponse.json(
            {
                error: isNetworkError ? "Network unavailable" : error.message,
                code: isNetworkError ? "NETWORK_ERROR" : "AUTH_ERROR",
                recoverable: true
            },
            {
                status: isNetworkError ? 503 : 500,
                headers: {
                    "Retry-After": isNetworkError ? "30" : "10",
                    "Cache-Control": "no-store"
                }
            }
        );
    }
}
