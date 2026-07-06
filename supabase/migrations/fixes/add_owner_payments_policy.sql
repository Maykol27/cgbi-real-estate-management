-- Migration: Enable select payments and documents for owners
-- Description: Allow property owners to view payment records and documents associated with their properties and tenants.

-- 1. Grant owners access to select payments of their properties/tenants
DROP POLICY IF EXISTS "Enable select payments for owners" ON "public"."payments";

CREATE POLICY "Enable select payments for owners"
ON "public"."payments"
FOR SELECT
TO authenticated
USING (
  -- Option A: The payment is directly linked to a property owned by the user
  property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  )
  OR
  -- Option B: Fallback when property_id is null (matches the tenant of any property owned by the user)
  tenant_id IN (
    SELECT tenant_id FROM properties WHERE owner_id = auth.uid()
  )
);

-- 2. Grant owners access to select documents of their tenants (e.g. rent receipts, tenant lease contracts)
DROP POLICY IF EXISTS "Enable select documents for owners" ON "public"."documents";

CREATE POLICY "Enable select documents for owners"
ON "public"."documents"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE owner_id = auth.uid()
    AND (
      tenant_id::text = target_user_id
      OR
      tenant_id::text = ANY(target_user_ids)
    )
  )
);
