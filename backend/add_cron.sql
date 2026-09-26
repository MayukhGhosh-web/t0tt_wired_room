SELECT cron.schedule('fetch-socials-job', '*/10 * * * *', $$
    SELECT net.http_post(
        url:='https://mmnxzumlspuxrvzkdynj.supabase.co/functions/v1/fetch_socials',
        headers:='{"Authorization": "Bearer sb_publishable_KDwhhGU_wDzQ-Fv2rIdhew_UgN6t6E2"}'::jsonb
    );
$$);
