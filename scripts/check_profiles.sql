-- check_profiles.sql
SELECT id,
    email,
    role,
    length(id) as id_len
FROM public.profiles
LIMIT 5;