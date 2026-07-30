"use client";

import { useEffect } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

import { saveSession } from "@/app/services/session.api";

export default function AutoSaveSession() {
  const {
    test,
    currentQuestion,
    savedAnswers,
    timeLeft,
  } = useTestSession();

  // ==========================
  // Автозбереження кожні 30 секунд
  // ==========================

  useEffect(() => {
    if (!test) return;

    const interval = setInterval(async () => {
      try {
        await saveSession({
          testId: test.id,

          currentQuestion,

          savedAnswers,

          timeLeft,

          finished: false,
        });
      } catch (error) {
        console.error(
          "Помилка автозбереження:",
          error
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [
    test,
    currentQuestion,
    savedAnswers,
    timeLeft,
  ]);

  // ==========================
  // Збереження після зміни відповіді
  // ==========================

  useEffect(() => {
    if (!test) return;

    saveSession({
      testId: test.id,

      currentQuestion,

      savedAnswers,

      timeLeft,

      finished: false,
    }).catch(console.error);

  }, [
    test,
    currentQuestion,
    savedAnswers,
  ]);

  return null;
}