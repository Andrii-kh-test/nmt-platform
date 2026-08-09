"use client";

import { useEffect } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

import { saveSession } from "@/app/services/session.api";

export default function AutoSaveSession() {
  const {
    sessionId,
    currentQuestion,
    savedAnswers,
    timeLeft,
  } = useTestSession();

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const interval = setInterval(
      async () => {
        try {
          await saveSession({
            sessionId,
            currentQuestion,
            savedAnswers,
            timeLeft,
            finished: false,
          });
        } catch (error) {
          console.error(
            "Помилка автозбереження сесії:",
            error
          );
        }
      },
      30000
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    sessionId,
    currentQuestion,
    savedAnswers,
    timeLeft,
  ]);

  return null;
}