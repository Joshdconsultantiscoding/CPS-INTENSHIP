-- Reset Script: Drop all existing policies and triggers before running migrations
-- Run this FIRST if you're re-running the migration scripts
-- =============================================
-- DROP ALL TRIGGERS FIRST
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_online ON public.profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS update_daily_reports_updated_at ON public.daily_reports;
DROP TRIGGER IF EXISTS update_channels_updated_at ON public.channels;
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
DROP TRIGGER IF EXISTS update_ai_chats_updated_at ON public.ai_chats;
DROP TRIGGER IF EXISTS update_api_settings_updated_at ON public.api_settings;
-- =============================================
-- DROP ALL POLICIES
-- =============================================
-- Drop all policies on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
-- Drop all policies on tasks
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
-- Drop all policies on daily_reports
DROP POLICY IF EXISTS "Users can view own reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.daily_reports;
-- Drop all policies on messages
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
-- Drop all policies on channels
DROP POLICY IF EXISTS "Users can view channels they belong to" ON public.channels;
DROP POLICY IF EXISTS "Admins can create channels" ON public.channels;
DROP POLICY IF EXISTS "Admins can update channels" ON public.channels;
-- Drop all policies on performance_scores
DROP POLICY IF EXISTS "Users can view own performance" ON public.performance_scores;
DROP POLICY IF EXISTS "Admins can manage performance" ON public.performance_scores;
-- Drop all policies on rewards
DROP POLICY IF EXISTS "Users can view own rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;
-- Drop all policies on achievements
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
-- Drop all policies on user_achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "System can grant achievements" ON public.user_achievements;
-- Drop all policies on notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
-- Drop all policies on calendar_events
DROP POLICY IF EXISTS "Users can view events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.calendar_events;
-- Drop all policies on activity_logs
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_logs;
DROP POLICY IF EXISTS "System can log activity" ON public.activity_logs;
-- Drop all policies on ai_chats
DROP POLICY IF EXISTS "Users can view own AI chats" ON public.ai_chats;
DROP POLICY IF EXISTS "Users can create AI chats" ON public.ai_chats;
DROP POLICY IF EXISTS "Users can update own AI chats" ON public.ai_chats;
-- Drop all policies on api_settings
DROP POLICY IF EXISTS "Anyone can view api settings" ON public.api_settings;
DROP POLICY IF EXISTS "Admins can insert api settings" ON public.api_settings;
DROP POLICY IF EXISTS "Admins can update api settings" ON public.api_settings;
DROP POLICY IF EXISTS "Admins can delete api settings" ON public.api_settings;