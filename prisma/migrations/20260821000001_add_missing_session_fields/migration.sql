-- Add missing Participant access code
ALTER TABLE "Participant"
ADD COLUMN "accessCode" TEXT;

-- Add session relation to TestResult
ALTER TABLE "TestResult"
ADD COLUMN "sessionId" INTEGER;

-- Unique relation: one result per session
CREATE UNIQUE INDEX "TestResult_sessionId_key"
ON "TestResult"("sessionId");

-- Foreign key TestResult -> TestSession
ALTER TABLE "TestResult"
ADD CONSTRAINT "TestResult_sessionId_fkey"
FOREIGN KEY ("sessionId")
REFERENCES "TestSession"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
