-- Change ticket_messages sender_id and finance_requests requester_id foreign keys to ON DELETE SET NULL

ALTER TABLE "public"."ticket_messages"
DROP CONSTRAINT "ticket_messages_sender_id_fkey";

ALTER TABLE "public"."ticket_messages"
ADD CONSTRAINT "ticket_messages_sender_id_fkey"
FOREIGN KEY ("sender_id")
REFERENCES "public"."profiles" ("id")
ON DELETE SET NULL;

ALTER TABLE "public"."finance_requests"
DROP CONSTRAINT "finance_requests_requester_id_fkey";

ALTER TABLE "public"."finance_requests"
ADD CONSTRAINT "finance_requests_requester_id_fkey"
FOREIGN KEY ("requester_id")
REFERENCES "public"."profiles" ("id")
ON DELETE SET NULL;
