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
  sessionId: number,
  router: AppRouterInstance
) {
  if (test.id === undefined) {
    throw new Error(
      "Неможливо завершити тест без id"
    );
  }

  if (!sessionId || sessionId <= 0) {
    throw new Error(
      "Неможливо завершити тест без sessionId"
    );
  }

  const testId = test.id;
const participantData = JSON.parse(
  localStorage.getItem("participant") || "{}"
);
  // -------------------------------
  // Завершуємо конкретну сесію
  // -------------------------------

  await finishSession(
  sessionId,
  0,
  answers
);

  // -------------------------------
  // Розрахунок результату
  // -------------------------------

  let result = calculateResult(
    test,
    answers
  );

  // -------------------------------
  // Якщо порушення —
  // анулюємо результат
  // -------------------------------

  if (reason === "security") {
    result = {
      earnedPoints: 0,

      maxPoints:
        result.maxPoints,

      percent: 0,

      correct: 0,

      incorrect: 0,

      skipped:
        test.questions.length,
    };
  }

  // -------------------------------
  // Записуємо результат
  // -------------------------------

  const saved = await saveResult({
  testId,

  sessionId,

  lastName:
    participantData.lastName || null,

  firstName:
    participantData.firstName || null,

  middleName:
    participantData.middleName || null,

  accessCode:
    participantData.accessCode || null,

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

  // -------------------------------
  // Очищаємо локальну сесію
  // -------------------------------

  localStorage.removeItem(
    "test-session"
  );

  localStorage.removeItem(
    "savedAnswers"
  );

  localStorage.removeItem(
    "selectedAnswers"
  );

  localStorage.removeItem(
    "currentQuestion"
  );

  localStorage.removeItem(
    "timeLeft"
  );

  localStorage.removeItem(
    "sessionId"
  );

  sessionStorage.clear();

  // -------------------------------
  // Переходимо на результат
  // -------------------------------

  router.replace(
    `/result/${saved.id}`
  );
}