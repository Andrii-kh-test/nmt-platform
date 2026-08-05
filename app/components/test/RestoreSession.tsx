"use client";

import { useEffect, useRef } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";
import { loadSession } from "@/app/services/session.api";

export default function RestoreSession() {

  const {
    test,
    restoreSession,
  } = useTestSession();

  const restored = useRef(false);

  useEffect(() => {

    if (!test) return;

    if (test.id === undefined) return;

    if (restored.current) return;

    restored.current = true;

    async function checkSession() {

      try {

        const testId = test?.id;

if (testId === undefined) return;

const data = await loadSession(testId);

        if (!data) return;

        restoreSession(
          data.currentQuestion,
          data.savedAnswers,
          data.timeLeft
        );

      } catch (error) {

        console.error(
          "Помилка відновлення сесії:",
          error
        );

      }

    }

    checkSession();

  }, [test]);

  return null;
}