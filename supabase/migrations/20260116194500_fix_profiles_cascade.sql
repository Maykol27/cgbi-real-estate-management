-- The ROOT CAUSE of the deletion error is that profiles.id references auth.users.id with NO ACTION.
-- When we verify FKs, we see "profiles_id_fkey" (or similar) is NO ACTION.
-- This blocks auth.admin.deleteUser() because the profile still exists.
-- FIX: Change this constraint to ON DELETE CASCADE.

ALTER TABLE "public"."profiles"
DROP CONSTRAINT "profiles_id_fkey";

ALTER TABLE "public"."profiles"
ADD CONSTRAINT "profiles_id_fkey"
FOREIGN KEY ("id")
REFERENCES "auth"."users" ("id")
ON DELETE CASCADE;
