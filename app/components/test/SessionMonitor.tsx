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
    setCurrentQuestion,
    stopTimer,
  } = useTestSession();

  const [blocked, setBlocked] = useState(false);

  const [blockReason, setBlockReason] =
    useState<string | null>(null);

  const [checking, setChecking] =
    useState(true);

  // =====================================================
  // Останнє серверне значення часу
  //
  // Використовується для визначення:
  // чи змінив адміністратор час,
  // чи це просто звичайний локальний відлік.
  // =====================================================

  const lastServerTimeRef =
    useRef<number | null>(null);

  useEffect(() => {
    if (!test?.id || !sessionId) {
      setChecking(false);
      return;
    }

    const testId = test.id;
    const currentSessionId = sessionId;

    let cancelled = false;

    async function checkSession() {
      try {
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
          "SESSION MONITOR:",
          session
        );

        // =================================================
        // БЛОКУВАННЯ
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
        // СИНХРОНІЗАЦІЯ ЧАСУ
        // =================================================
        //
        // ВАЖЛИВО:
        //
        // Не можна кожні 2 секунди робити:
        //
        // setTimeLeft(session.timeLeft)
        //
        // бо локальний Timer сам відраховує секунди.
        //
        // Тому:
        //
        // 1. Перша відповідь сервера встановлює
        //    початковий час.
        //
        // 2. Надалі невелика різниця (0–2 сек)
        //    ігнорується.
        //
        // 3. Якщо серверне значення змінилося
        //    суттєво — це адміністративна зміна,
        //    наприклад +5 хвилин.
        //
        // =================================================

        if (
          typeof session.timeLeft === "number"
        ) {
          const serverTime = Math.max(
            0,
            Math.floor(session.timeLeft)
          );

          // -----------------------------------------------
          // Перша синхронізація
          // -----------------------------------------------

          if (
            lastServerTimeRef.current === null
          ) {
            lastServerTimeRef.current =
              serverTime;

            setTimeLeft(serverTime);
          } else {
            const previousServerTime =
              lastServerTimeRef.current;

            // Запам'ятовуємо нове серверне значення
            lastServerTimeRef.current =
              serverTime;

            // ---------------------------------------------
            // Перевіряємо зміну серверного часу
            // ---------------------------------------------
            //
            // У нормальному режимі серверне значення
            // може відрізнятися від локального на 1–2 сек
            // через затримку мережі.
            //
            // Таку різницю НЕ синхронізуємо.
            //
            // Якщо адміністратор додав час:
            //
            // 3900 → 4200
            //
            // різниця буде значною, тому синхронізація
            // виконається.
            //
            const serverChanged =
              Math.abs(
                serverTime -
                  previousServerTime
              ) > 2;

            if (serverChanged) {
              setTimeLeft(serverTime);
            }
          }
        }

        // =================================================
        // СИНХРОНІЗАЦІЯ ПОТОЧНОГО ПИТАННЯ
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
        // ЗАВЕРШЕННЯ
        // =================================================

        if (session.finished) {
          stopTimer();
        }
      } catch (error) {
        console.error(
          "Помилка перевірки сесії:",
          error
        );
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    // =====================================================
    // Перша перевірка одразу
    // =====================================================

    checkSession();

    // =====================================================
    // Перевірка кожні 2 секунди
    // =====================================================

    const interval = setInterval(
      checkSession,
      2000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    test?.id,
    sessionId,
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