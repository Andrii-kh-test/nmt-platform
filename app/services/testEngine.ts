import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { Test } from "@/app/types/test";
import type { UserAnswers } from "@/app/context/TestSessionContext";

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
  // Завершення сесії тестування
  // ==========================

  await finishSession(
    test.id,
    0,
    answers,
    timeLeft
  );



  // ==========================
  // Розрахунок результату
  // ==========================

  const result = calculateResult(
    test,
    answers
  );



  // ==========================
  // Збереження результату
  // ==========================

  const saved = await saveResult({

    testId: test.id,


    earnedPoints:
      result.earnedPoints,


    maxPoints:
      result.maxPoints,


    percent:
      result.percent,


    correct:
      result.correct,


    incorrect:
      result.incorrect,


    skipped:
      result.skipped,


    timeSpent:
      test.duration * 60 - timeLeft,


    answers,


    finishReason: reason,

  });



  // ==========================
  // Перехід на сторінку результатів
  // ==========================

  router.push(
    `/result/${saved.id}`
  );

}