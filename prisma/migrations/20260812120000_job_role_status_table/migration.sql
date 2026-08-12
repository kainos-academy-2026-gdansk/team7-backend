-- CreateTable
CREATE TABLE "Status" (
    "statusId" SERIAL NOT NULL,
    "statusName" TEXT NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("statusId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Status_statusName_key" ON "Status"("statusName");

-- Seed the lookup table with the values previously held by the JobRoleStatus enum
INSERT INTO "Status" ("statusName") VALUES ('OPEN'), ('CLOSED');

-- AlterTable: rename columns to match the agreed contract
ALTER TABLE "JobRole" RENAME COLUMN "openPositions" TO "numberOfOpenPositions";
ALTER TABLE "JobRole" RENAME COLUMN "sharePointLink" TO "sharepointUrl";

-- AlterTable: replace the enum column with a foreign key, preserving existing values
ALTER TABLE "JobRole" ADD COLUMN "statusId" INTEGER;

UPDATE "JobRole"
SET "statusId" = "Status"."statusId"
FROM "Status"
WHERE "Status"."statusName" = "JobRole"."status"::TEXT;

ALTER TABLE "JobRole" ALTER COLUMN "statusId" SET NOT NULL;

-- DropIndex
DROP INDEX "JobRole_status_idx";

-- AlterTable
ALTER TABLE "JobRole" DROP COLUMN "status";

-- DropEnum
DROP TYPE "JobRoleStatus";

-- CreateIndex
CREATE INDEX "JobRole_statusId_idx" ON "JobRole"("statusId");

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("statusId") ON DELETE RESTRICT ON UPDATE CASCADE;
