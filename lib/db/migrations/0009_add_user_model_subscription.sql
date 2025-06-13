ALTER TABLE "UserModel" ADD COLUMN IF NOT EXISTS "expiresAt" timestamp;
ALTER TABLE "UserModel" ADD COLUMN IF NOT EXISTS "canceled" boolean DEFAULT false;
