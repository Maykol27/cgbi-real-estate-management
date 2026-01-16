-- Migration: Enable Admin Payments
-- Description: Allow Admins and Collaborators to insert and select payments for any tenant.

-- 1. Create Policy for Payments Insert
DROP POLICY IF EXISTS "Enable insert for admins and collaborators" ON "public"."payments";

CREATE POLICY "Enable insert for admins and collaborators"
ON "public"."payments"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role = 'Admin' OR role = 'Administrador' OR role = 'Colaborador')
  )
);

-- 2. Create Policy for Payments Select (Access to all)
DROP POLICY IF EXISTS "Enable select for admins and collaborators" ON "public"."payments";

CREATE POLICY "Enable select for admins and collaborators"
ON "public"."payments"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role = 'Admin' OR role = 'Administrador' OR role = 'Colaborador')
  )
);
