'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Email and password are required.' }
    }

    const supabase = await createClient()

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('Login action error:', error.message)
            if (error.message.toLowerCase().includes('invalid login credentials')) {
                return { error: 'Invalid email or password. Please try again.' }
            }
            return { error: error.message }
        }

        if (data?.user) {
            // Success! The dashboard's presence hook will handle online status.
        }
    } catch (err: any) {
        console.error('Login action critical failure:', err)
        if (err.message?.toLowerCase().includes('failed to fetch')) {
            return { error: 'The server could not communicate with Supabase. Please ensure your project is active and .env.local settings are correct.' }
        }
        return { error: 'An unexpected internal error occurred. Please try again later.' }
    }

    redirect('/dashboard')
}

export async function oauthLoginAction(provider: 'google' | 'github' | 'facebook') {
    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${origin}/auth/callback`,
            queryParams: provider === 'google' ? {
                access_type: 'offline',
                prompt: 'consent',
            } : undefined,
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data?.url) {
        redirect(data.url)
    }

    return { error: 'Could not generate login URL.' }
}

export async function signUpAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as string
    const department = formData.get('department') as string

    if (!email || !password || !fullName) {
        return { error: 'Full name, email, and password are required.' }
    }

    const supabase = await createClient()

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role || 'intern',
                    department: department,
                    auth_provider: 'email',
                },
            },
        })

        if (error) {
            if (error.message.toLowerCase().includes('already registered')) {
                return { error: 'This email is already registered. Please sign in instead.' }
            }
            return { error: error.message }
        }

        if (data.user && data.session) {
            // Success and auto-logged in
        } else if (data.user && !data.session) {
            // Sign-up successful but session not established (maybe email confirmation)
            // Try auto sign-in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (signInError) {
                return { success: false, message: 'Account created! Please sign in.' }
            }
        }
    } catch (err: any) {
        console.error('Sign-up action error:', err)
        return { error: 'An unexpected error occurred during sign-up.' }
    }

    redirect('/dashboard')
}
