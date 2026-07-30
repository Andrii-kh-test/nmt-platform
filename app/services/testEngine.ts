import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { Test } from "@/app/types/test";
import { UserAnswers } from "@/app/context/TestSessionContext";

import { calculateResult } from "./result.service";
import { saveResult } from "./result.api";
import { finishSession } from "./session.api";

export type FinishReason =
  | "manual"
  | "timeout"
  | "security";

export async function finishTest(
  reason: FinishReason,
  test: Test,
  answers: UserAnswers,
  timeLeft: number,
  router: AppRouterInstance
) {
  // ==========================
  // Позначаємо сесію завершеною
  // ==========================

  await finishSession(
    test.id,
    0,
    answers,
    timeLeft
  );

  // ==========================
  // Обчислюємо результат
  // ==========================

  const result = calculateResult(
    test,
    answers
  );

  // ==========================
  // Зберігаємо результат
  // ==========================

  const saved = await saveResult({
    testId: test.id,

    earnedPoints: result.earnedPoints,
    maxPoints: result.maxPoints,
    percent: result.percent,

    correct: result.correct,
    incorrect: result.incorrect,
    skipped: result.skipped,

    timeSpent:
      test.duration * 60 - timeLeft,

    answers,

    finishReason: reason,
  });

  // ==========================
  // Переходимо на сторінку результатів
  // ==========================

  router.push(`/result/${saved.id}`);
}