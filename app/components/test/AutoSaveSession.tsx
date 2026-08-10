"use client";

import { useEffect } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

import { saveSession } from "@/app/services/session.api";

export default function AutoSaveSession() {
  const {
    sessionId,
    currentQuestion,
    savedAnswers,
  } = useTestSession();

  useEffect(() => {
    if (
      sessionId === null ||
      sessionId <= 0
    ) {
      return;
    }

    // Фіксуємо ID сесії як number.
    // Це також усуває помилку TypeScript
    // у вкладеній async-функції.
    const currentSessionId = sessionId;

    async function performSave() {
      try {
        await saveSession({
          sessionId: currentSessionId,

          currentQuestion,

          savedAnswers,

          finished: false,
        });
      } catch (error) {
        console.error(
          "Помилка автозбереження сесії:",
          error
        );
      }
    }

    // Перше збереження одразу
    performSave();

    // Подальше автозбереження
    // кожні 30 секунд
    const interval = setInterval(
      performSave,
      30000
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    sessionId,
    currentQuestion,
    savedAnswers,
  ]);

  return null;
}