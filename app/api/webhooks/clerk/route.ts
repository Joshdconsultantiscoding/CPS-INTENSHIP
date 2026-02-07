import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err)
        return new Response('Error occured', {
            status: 400
        })
    }

    const eventType = evt.type

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, email_addresses, image_url, first_name, last_name, public_metadata } = evt.data
        const email = email_addresses[0]?.email_address
        const fullName = [first_name, last_name].filter(Boolean).join(' ')

        if (!email) {
            return new Response('No email found', { status: 400 })
        }

        const supabase = await createAdminClient()

        // Determine role - default to 'intern' unless specified in metadata
        // We do NOT override 'admin' role here to prevent accidental demotion if setup manually
        // But we initiate as 'intern' for new users.
        const role = (public_metadata?.role as string) || 'intern'

        const { error } = await supabase.from('profiles').upsert({
            id: id,
            email: email,
            full_name: fullName,
            avatar_url: image_url,
            role: role,
            updated_at: new Date().toISOString(),
        })

        if (error) {
            console.error('Error upserting profile:', error)
            return new Response('Error upserting profile', { status: 500 })
        }

        // NEW: Notify admins and broadcast when a NEW user is created
        if (eventType === 'user.created') {
            try {
                // 1. Notify all admins about the new intern
                const { data: admins } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'admin');

                if (admins && admins.length > 0) {
                    const { createNotification } = await import('@/lib/notifications/notification-service');
                    for (const admin of admins) {
                        await createNotification({
                            userId: admin.id,
                            title: 'New Intern Registered',
                            message: `New intern '${fullName || email}' just joined the platform.`,
                            type: 'system',
                            link: '/dashboard/interns',
                            priority: 'normal',
                            metadata: { internId: id }
                        });
                    }
                    console.log(`[Webhook] Notified ${admins.length} admins about new intern: ${id}`);
                }

                // 2. Broadcast via Ably for real-time UI updates (admin dashboards, interns list)
                if (process.env.ABLY_API_KEY) {
                    const Ably = require('ably');
                    const ably = new Ably.Rest(process.env.ABLY_API_KEY);
                    const channel = ably.channels.get('global-updates');
                    await channel.publish('new-intern', {
                        id: id,
                        email: email,
                        full_name: fullName,
                        avatar_url: image_url,
                        role: role,
                        created_at: new Date().toISOString()
                    });
                    console.log(`[Webhook] Broadcasted new intern via Ably: ${id}`);
                }
            } catch (notifyError) {
                console.warn('[Webhook] Non-fatal error during admin notification:', notifyError);
                // Don't fail the webhook for notification errors
            }
        }
    }

    return new Response('', { status: 200 })
}
