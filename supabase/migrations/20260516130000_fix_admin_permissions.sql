-- ==============================================================================
-- Migration: Fix Admin Permissions for Financial Status & Storage
-- ==============================================================================

-- 1. Ensure Storage Bucket is public and accessible
-- The project_files bucket holds property images. We need to make sure anyone can select from it.
CREATE POLICY "Public Access to project_files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'project_files');

-- 2. Fix profiles update for Admins/Collabs
-- The previous policy used a self-referential SELECT which might cause RLS silent failure.
-- We use auth.uid() directly inside a subquery.

DROP POLICY IF EXISTS "Admins/Collabs can update financial status" ON "public"."profiles";

CREATE POLICY "Admins/Collabs can update financial status"
ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'Administrador', 'Colaborador')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'Administrador', 'Colaborador')
);
