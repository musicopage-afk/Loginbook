CREATE TABLE "login_throttles" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "login_throttles_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "login_throttles_expires_at_idx" ON "login_throttles"("expires_at");
