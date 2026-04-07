CREATE TABLE "Files" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "assignedRepId" TEXT,
  "placementDate" TIMESTAMP(3) NOT NULL,
  "collectedDate" TIMESTAMP(3),
  "fileScore" INTEGER NOT NULL,
  "attachedFile" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Files_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Files_fileScore_check" CHECK ("fileScore" >= 0 AND "fileScore" <= 100)
);

CREATE INDEX "Files_clientId_placementDate_idx" ON "Files"("clientId", "placementDate");
CREATE INDEX "Files_assignedRepId_idx" ON "Files"("assignedRepId");

ALTER TABLE "Files"
ADD CONSTRAINT "Files_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Files"
ADD CONSTRAINT "Files_assignedRepId_fkey"
FOREIGN KEY ("assignedRepId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
