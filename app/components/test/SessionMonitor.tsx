"use client";

import { useEffect, useRef, useState } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

type SessionState = {
  id: number;
  blocked: boolean;
  blockReason: string | null;
  timeLeft: number;
  extraTime: number;
  finished: boolean;
  currentQuestion: number;
};

export default function SessionMonitor() {
  const {
    test,
    sessionId,
    timeLeft,
    setTimeLeft,
    currentQuestion,
    setCurrentQuestion,
    stopTimer,
  } = useTestSession();

  const [blocked, setBlocked] = useState(false);

  const [blockReason, setBlockReason] =
    useState<string | null>(null);

  const [checking, setChecking] = useState(true);

  // =====================================================
  // Останнє серверне значення часу
  // =====================================================

  const lastServerTimeRef =
    useRef<number | null>(null);

  // =====================================================
  // Останнє відправлене питання
  // =====================================================

  const lastSentQuestionRef =
    useRef<number | null>(null);

  // =====================================================
  // Захист від одночасних запитів
  // =====================================================

  const requestInProgressRef =
    useRef(false);

  useEffect(() => {
    if (!test?.id || !sessionId) {
      setChecking(false);
      return;
    }

    const testId = test.id;
    const currentSessionId = sessionId;

    let cancelled = false;

    async function checkAndSyncSession() {
      if (cancelled) {
        return;
      }

      // Не запускаємо наступний цикл,
      // якщо попередній ще не завершився.
      if (requestInProgressRef.current) {
        return;
      }

      requestInProgressRef.current = true;

      try {
        // =================================================
        // 1. ОТРИМУЄМО АКТУАЛЬНИЙ СТАН ІЗ СЕРВЕРА
        // =================================================

        const response = await fetch(
          `/api/session/${testId}?sessionId=${currentSessionId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          console.error(
            "SessionMonitor HTTP error:",
            response.status
          );

          return;
        }

        const session: SessionState | null =
          await response.json();

        if (!session || cancelled) {
          return;
        }

        console.log(
          "SESSION MONITOR GET:",
          session
        );

        // =================================================
        // 2. БЛОКУВАННЯ
        // =================================================

        if (session.blocked) {
          setBlocked(true);

          setBlockReason(
            session.blockReason ||
              "Тестування заблоковано адміністратором."
          );

          stopTimer();
        } else {
          setBlocked(false);
          setBlockReason(null);
        }

        // =================================================
        // 3. СИНХРОНІЗАЦІЯ ЧАСУ
        // =================================================

        let effectiveTimeLeft =
          timeLeft;

        if (
          typeof session.timeLeft ===
          "number"
        ) {
          const serverTime = Math.max(
            0,
            Math.floor(session.timeLeft)
          );

          // -----------------------------------------------
          // Перша синхронізація
          // -----------------------------------------------

          if (
            lastServerTimeRef.current ===
            null
          ) {
            lastServerTimeRef.current =
              serverTime;

            effectiveTimeLeft =
              serverTime;

            setTimeLeft(serverTime);
          } else {
            const previousServerTime =
              lastServerTimeRef.current;

            // ---------------------------------------------
            // Визначаємо, чи змінив сервер час
            // ---------------------------------------------

            const serverChanged =
              Math.abs(
                serverTime -
                  previousServerTime
              ) > 2;

            lastServerTimeRef.current =
              serverTime;

            if (serverChanged) {
              // Адміністратор міг:
              // + додати час
              // + забрати час
              // + встановити нове значення

              effectiveTimeLeft =
                serverTime;

              setTimeLeft(serverTime);
            } else {
              // Серверне значення є звичайним
              // відліком часу.

              effectiveTimeLeft =
                timeLeft;
            }
          }
        }

        // =================================================
        // 4. СИНХРОНІЗАЦІЯ ПОТОЧНОГО ПИТАННЯ
        // =================================================

        if (
          typeof session.currentQuestion ===
          "number"
        ) {
          setCurrentQuestion(
            session.currentQuestion
          );
        }

        // =================================================
        // 5. ВІДПРАВЛЯЄМО АКТУАЛЬНИЙ СТАН У БД
        // =================================================

        // Якщо сервер щойно повернув адміністративно
        // змінений час — використовуємо саме його,
        // а не старе локальне значення.

        const questionToSave =
          typeof session.currentQuestion ===
          "number"
            ? session.currentQuestion
            : currentQuestion;

        const timeToSave =
          typeof effectiveTimeLeft ===
          "number"
            ? Math.max(
                0,
                Math.floor(
                  effectiveTimeLeft
                )
              )
            : Math.max(
                0,
                Math.floor(timeLeft)
              );

        const saveResponse =
          await fetch(
            `/api/session/${testId}?sessionId=${currentSessionId}`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              cache: "no-store",
              body: JSON.stringify({
                sessionId:
                  currentSessionId,

                currentQuestion:
                  questionToSave,

                timeLeft:
                  timeToSave,

                finished:
                  session.finished,
              }),
            }
          );

        if (!saveResponse.ok) {
          console.error(
            "SessionMonitor POST error:",
            saveResponse.status
          );
        } else {
          lastSentQuestionRef.current =
            questionToSave;

          console.log(
            "SESSION MONITOR POST:",
            {
              currentQuestion:
                questionToSave,

              timeLeft:
                timeToSave,
            }
          );
        }

        // =================================================
        // 6. ЗАВЕРШЕННЯ
        // =================================================

        if (session.finished) {
          stopTimer();
        }
      } catch (error) {
        console.error(
          "Помилка синхронізації сесії:",
          error
        );
      } finally {
        requestInProgressRef.current =
          false;

        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    // =====================================================
    // Перша перевірка одразу
    // =====================================================

    checkAndSyncSession();

    // =====================================================
    // Синхронізація кожні 2 секунди
    // =====================================================

    const interval = setInterval(
      checkAndSyncSession,
      2000
    );

    return () => {
      cancelled = true;

      clearInterval(interval);

      requestInProgressRef.current =
        false;
    };
  }, [
    test?.id,
    sessionId,
    timeLeft,
    currentQuestion,
    setTimeLeft,
    setCurrentQuestion,
    stopTimer,
  ]);

  // =====================================================
  // Поки перша перевірка не завершилася
  // =====================================================

  if (checking) {
    return null;
  }

  // =====================================================
  // ЗАБЛОКОВАНО
  // =====================================================

  if (blocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="text-6xl">
            🔒
          </div>

          <h1 className="mt-6 text-3xl font-bold text-red-700">
            Тестування заблоковано
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-gray-700">
            {blockReason ||
              "Тестування заблоковано адміністратором."}
          </p>

          <div className="mt-6 rounded-lg bg-gray-100 p-4 text-sm text-gray-600">
            Подальше виконання завдань
            недоступне.
          </div>
        </div>
      </div>
    );
  }

  return null;
}