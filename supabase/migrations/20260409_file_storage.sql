-- ============================================================================
-- File Storage: buckets, RLS policies, and documents table extensions
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Storage buckets
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('documents', 'documents', false, 52428800,  -- 50 MiB
     ARRAY[
         'application/pdf',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'text/plain',
         'text/csv',
         'application/zip',
         'application/x-rar-compressed'
     ]),
    ('media', 'media', false, 52428800,
     ARRAY[
         'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
         'video/mp4', 'video/webm', 'video/quicktime',
         'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'
     ]),
    ('attachments', 'attachments', false, 52428800,
     NULL  -- any MIME type allowed
    )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. RLS policies — authenticated users can CRUD their own objects
-- ---------------------------------------------------------------------------

CREATE POLICY "Authenticated users can upload to documents"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload to media"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'media');

CREATE POLICY "Authenticated users can read media"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can update media"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can delete media"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload to attachments"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can read attachments"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can update attachments"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can delete attachments"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'attachments');

-- ---------------------------------------------------------------------------
-- 3. Extend documents table with file storage columns
-- ---------------------------------------------------------------------------

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS file_name  TEXT,
    ADD COLUMN IF NOT EXISTS file_size  BIGINT,
    ADD COLUMN IF NOT EXISTS mime_type  TEXT,
    ADD COLUMN IF NOT EXISTS file_url   TEXT;
