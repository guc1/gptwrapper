CREATE TABLE IF NOT EXISTS "UserModel" (
    "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "modelId" varchar(64) NOT NULL,
    PRIMARY KEY ("userId", "modelId")
);
