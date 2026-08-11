"use client";

import { useEffect, useRef } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

type RestoredSession = {
  id: number;
  currentQuestion: number;
  savedAnswers: Record<number, number[]>;
  timeLeft: number;
  finished: boolean;
  blocked: boolean;
  blockReason: string | null;
  extraTime: number;
};

export default function RestoreSession() {
  const {
    test,
    sessionId,
    setSessionId,
    restoreSession,
  } = useTestSession();

  const restored = useRef(false);

  useEffect(() => {
    // --------------------------------------------------
    // 1. Чекаємо, поки тест буде завантажений
    // --------------------------------------------------

    if (!test?.id) {
      return;
    }

    // --------------------------------------------------
    // 2. Якщо сесію вже відновлено —
    //    повторно нічого не робимо
    // --------------------------------------------------

    if (restored.current) {
      return;
    }

    // --------------------------------------------------
    // 3. Визначаємо sessionId
    //
    // Спочатку беремо його з Context.
    // Якщо Context порожній — беремо з localStorage.
    // --------------------------------------------------

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      const storedSessionId =
        localStorage.getItem("testSessionId");

      if (storedSessionId) {
        const parsedSessionId =
          Number(storedSessionId);

        if (
          Number.isInteger(parsedSessionId) &&
          parsedSessionId > 0
        ) {
          currentSessionId =
            parsedSessionId;

          // Повертаємо sessionId у Context
          setSessionId(parsedSessionId);
        }
      }
    }

    // --------------------------------------------------
    // 4. Якщо sessionId немає —
    //    відновлювати нічого
    // --------------------------------------------------

    if (!currentSessionId) {
      console.warn(
        "RESTORE SESSION: sessionId не знайдено."
      );

      return;
    }

    const testId = test.id;

    let cancelled = false;

    async function restore() {
      try {
        console.log(
          "RESTORE SESSION:",
          {
            testId,
            sessionId: currentSessionId,
          }
        );

        // ------------------------------------------------
        // 5. Отримуємо саме цю сесію
        // ------------------------------------------------

        const response = await fetch(
          `/api/session/${testId}?sessionId=${currentSessionId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          console.error(
            "RESTORE SESSION HTTP ERROR:",
            response.status
          );

          return;
        }

        const data: RestoredSession | null =
          await response.json();

        if (!data || cancelled) {
          return;
        }

        console.log(
          "RESTORE SESSION DATA:",
          data
        );

        // ------------------------------------------------
        // 6. Перевіряємо, що сервер повернув
        //    саме потрібну сесію
        // ------------------------------------------------

        if (data.id !== currentSessionId) {
          console.error(
            "RESTORE SESSION: отримано іншу сесію.",
            {
              requestedSessionId:
                currentSessionId,
              receivedSessionId:
                data.id,
            }
          );

          return;
        }

        // ------------------------------------------------
        // 7. Перевіряємо час
        // ------------------------------------------------

        if (
          typeof data.timeLeft !==
          "number"
        ) {
          console.error(
            "RESTORE SESSION: некоректний timeLeft."
          );

          return;
        }

        // ------------------------------------------------
        // 8. Відновлюємо стан у Context
        // ------------------------------------------------

        restoreSession(
          typeof data.currentQuestion ===
            "number"
            ? data.currentQuestion
            : 0,

          data.savedAnswers ?? {},

          Math.max(
            0,
            Math.floor(data.timeLeft)
          )
        );

        // ------------------------------------------------
        // 9. Позначаємо сесію як відновлену
        // ------------------------------------------------

        restored.current = true;

        console.log(
          "RESTORE SESSION SUCCESS:",
          {
            sessionId:
              data.id,
            timeLeft:
              data.timeLeft,
            currentQuestion:
              data.currentQuestion,
          }
        );
      } catch (error) {
        console.error(
          "RESTORE SESSION ERROR:",
          error
        );
      }
    }

    restore();

    return () => {
      cancelled = true;
    };
  }, [
    test,
    sessionId,
    setSessionId,
    restoreSession,
  ]);

  // Компонент нічого не відображає.
  return null;
}