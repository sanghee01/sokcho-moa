-- Keep Storage enforcement aligned with the 3MB application limit. This leaves
-- enough room for multipart metadata under Vercel's 4.5MB request body ceiling.
update storage.buckets
set file_size_limit = 3 * 1024 * 1024
where id = 'feedback-images';
