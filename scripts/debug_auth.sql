-- check_jwt.sql
-- Run this in Supabase SQL Editor to see what the current server-side session thinks
-- Note: This won't show YOUR browser session, but we can create a function to return it.
CREATE OR REPLACE FUNCTION public.get_my_jwt_claims() RETURNS jsonb LANGUAGE hljs AS $$
select auth.jwt();
$$;
-- Actually, just use this query if you can run it as the user, 
-- but you can't easily run SQL Editor as another user.
-- Better to create a protected table or view that returns this.
CREATE OR REPLACE VIEW public.debug_my_auth AS
SELECT auth.uid() as uid,
    auth.jwt()->>'email' as email,
    auth.jwt()->>'sub' as sub,
    auth.jwt() as full_jwt;
GRANT SELECT ON public.debug_my_auth TO authenticated;