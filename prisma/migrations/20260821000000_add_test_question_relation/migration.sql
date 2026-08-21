-- =====================================================
-- CREATE TestQuestion
-- =====================================================

CREATE TABLE "TestQuestion" (
    "id" SERIAL NOT NULL,
    "testId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TestQuestion_pkey"
        PRIMARY KEY ("id")
);

-- =====================================================
-- MIGRATE EXISTING QUESTION -> TEST RELATIONS
--
-- Старі дані:
-- Question.testId
-- Question.order
--
-- Нові дані:
-- TestQuestion.testId
-- TestQuestion.questionId
-- TestQuestion.order
-- =====================================================

INSERT INTO "TestQuestion" (
    "testId",
    "questionId",
    "order"
)
SELECT
    "testId",
    "id",
    "order"
FROM "Question"
WHERE "testId" IS NOT NULL;

-- =====================================================
-- UNIQUE RELATION
-- Один Question не може бути двічі
-- прив'язаний до одного Test.
-- =====================================================

CREATE UNIQUE INDEX "TestQuestion_testId_questionId_key"
ON "TestQuestion"("testId", "questionId");

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX "TestQuestion_testId_order_idx"
ON "TestQuestion"("testId", "order");

CREATE INDEX "TestQuestion_questionId_idx"
ON "TestQuestion"("questionId");

-- =====================================================
-- FOREIGN KEYS
-- =====================================================

ALTER TABLE "TestQuestion"
ADD CONSTRAINT "TestQuestion_testId_fkey"
FOREIGN KEY ("testId")
REFERENCES "Test"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "TestQuestion"
ADD CONSTRAINT "TestQuestion_questionId_fkey"
FOREIGN KEY ("questionId")
REFERENCES "Question"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- =====================================================
-- REMOVE OLD RELATION
--
-- Після перенесення даних
-- Question більше не зберігає testId.
-- =====================================================

ALTER TABLE "Question"
DROP CONSTRAINT "Question_testId_fkey";

ALTER TABLE "Question"
DROP COLUMN "testId";

ALTER TABLE "Question"
DROP COLUMN "order";