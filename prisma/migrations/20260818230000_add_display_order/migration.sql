-- AlterTable
ALTER TABLE "Test" ADD COLUMN "displayOrder" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Test_displayOrder_key"
ON "Test"("displayOrder");
