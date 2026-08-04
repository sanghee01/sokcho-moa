-- Keep administrator uploads within Vercel's request-body ceiling as well as
-- the shared application-level 3MB image policy.
update storage.buckets
set file_size_limit = 3 * 1024 * 1024
where id = 'event-images';
