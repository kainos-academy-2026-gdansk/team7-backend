-- Seed application lifecycle statuses in the shared lookup table.
INSERT INTO "Status" ("statusName")
VALUES
    ('IN_PROGRESS'),
    ('HIRED'),
    ('REJECTED')
ON CONFLICT ("statusName") DO NOTHING;

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "applicantId" INTEGER NOT NULL,
    "jobRoleId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "experience" VARCHAR(1000) NOT NULL,
    "salaryExpectation" VARCHAR(100) NOT NULL,
    "skills" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_jobRoleId_statusId_idx" ON "Application"("jobRoleId", "statusId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicantId_jobRoleId_key" ON "Application"("applicantId", "jobRoleId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("statusId") ON DELETE RESTRICT ON UPDATE CASCADE;
