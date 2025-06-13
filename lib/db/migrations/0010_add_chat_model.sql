ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "modelId" varchar(64) NOT NULL DEFAULT 'chat-model';
