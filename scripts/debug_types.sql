-- check_types.sql
SELECT table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN (
        'profiles',
        'rewards',
        'achievements',
        'point_history'
    )
    AND column_name IN ('id', 'user_id');