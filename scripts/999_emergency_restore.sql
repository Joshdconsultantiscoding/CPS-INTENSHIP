-- EMERGENCY RESTORE SCRIPT
-- Only run this if you need to completely reset the database
-- WARNING: This will delete ALL data and start fresh
-- =============================================
-- STEP 1: Drop all custom tables
-- =============================================
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.performance_scores CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.ai_chats CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.daily_reports CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.api_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
-- =============================================
-- STEP 2: Drop all custom functions
-- =============================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_presence(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.mark_messages_delivered() CASCADE;
-- =============================================
-- STEP 3: After running this, re-run migrations
-- =============================================
-- Now run the following scripts in order:
-- 1. 001_create_schema.sql
-- 2. 002_api_settings.sql
-- 3. 003_message_status.sql
-- 4. 004_auth_provider.sql
-- This will give you a completely fresh database setup