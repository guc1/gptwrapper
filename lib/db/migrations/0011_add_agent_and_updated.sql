ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "agentId" varchar(64);
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT now();
UPDATE "Chat" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
