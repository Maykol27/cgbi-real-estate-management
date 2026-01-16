-- Change properties owner_id foreign key to ON DELETE SET NULL
ALTER TABLE "public"."properties"
DROP CONSTRAINT "properties_owner_id_fkey";

ALTER TABLE "public"."properties"
ADD CONSTRAINT "properties_owner_id_fkey"
FOREIGN KEY ("owner_id")
REFERENCES "public"."profiles" ("id")
ON DELETE SET NULL;
