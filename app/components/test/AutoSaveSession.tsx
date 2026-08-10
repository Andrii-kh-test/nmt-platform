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
    if (!sessionId) {
      return;
    }

    const currentSessionId = sessionId;

    async function autoSave() {
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

    const interval = setInterval(
      autoSave,
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