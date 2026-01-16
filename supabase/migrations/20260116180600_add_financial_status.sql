-- Migration: Add Financial Status to Profiles
-- Description: Add a column to track the manual financial status of a tenant.

ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "financial_status" text DEFAULT 'Al Día';
