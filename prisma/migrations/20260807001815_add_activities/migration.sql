-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "activityId" TEXT;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "defaultActivityId" TEXT;

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "function" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_function_activity_key" ON "Activity"("function", "activity");

-- CreateIndex
CREATE INDEX "Asset_activityId_idx" ON "Asset"("activityId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_defaultActivityId_fkey" FOREIGN KEY ("defaultActivityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
