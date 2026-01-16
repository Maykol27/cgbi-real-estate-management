-- Change tickets assigned_to, requester_id and visits advisor foreign keys to ON DELETE SET NULL

ALTER TABLE "public"."tickets"
DROP CONSTRAINT "tickets_assigned_to_fkey",
DROP CONSTRAINT "tickets_requester_id_fkey";

ALTER TABLE "public"."tickets"
ADD CONSTRAINT "tickets_assigned_to_fkey"
FOREIGN KEY ("assigned_to")
REFERENCES "public"."profiles" ("id")
ON DELETE SET NULL;

ALTER TABLE "public"."tickets"
ADD CONSTRAINT "tickets_requester_id_fkey"
FOREIGN KEY ("requester_id")
REFERENCES "public"."profiles" ("id")
ON DELETE SET NULL;

-- Note: visits might not have an explicit advisor FK or it might be named differently.
-- Based on the SQL output, I saw 'visits_property_id_fkey' but not advisor. 
-- Checking the StoreContext types, Visit has an 'advisor' field. 
-- I will check if 'visits' has an 'advisor' column and constraint. 
-- If the constraint doesn't exist by name, I'll try to add it only if the column exists.

-- Safe constraint update for visits if exists as FK
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'visits_advisor_fkey') THEN
    ALTER TABLE "public"."visits" DROP CONSTRAINT "visits_advisor_fkey";
    ALTER TABLE "public"."visits" ADD CONSTRAINT "visits_advisor_fkey" FOREIGN KEY ("advisor") REFERENCES "public"."profiles" ("id") ON DELETE SET NULL;
  END IF;
END $$;
