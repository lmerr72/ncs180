CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "repId" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" TEXT NOT NULL,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_clientId_timestamp_idx" ON "AuditLog"("clientId", "timestamp");

ALTER TABLE "AuditLog"
ADD CONSTRAINT "AuditLog_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
