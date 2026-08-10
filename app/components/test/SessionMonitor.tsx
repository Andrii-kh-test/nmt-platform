"use client";

import { useEffect, useState } from "react";

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
    setTimeLeft,
    setCurrentQuestion,
    stopTimer,
  } = useTestSession();

  const [blocked, setBlocked] = useState(false);
  const [blockReason, setBlockReason] =
    useState<string | null>(null);

  const [checking, setChecking] = useState(true);

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

        // ==========================================
        // БЛОКУВАННЯ
        // ==========================================

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

        // ==========================================
        // СИНХРОНІЗАЦІЯ ЧАСУ
        // ==========================================

        if (
          typeof session.timeLeft === "number"
        ) {
          setTimeLeft(session.timeLeft);
        }

        // ==========================================
        // СИНХРОНІЗАЦІЯ ПОТОЧНОГО ПИТАННЯ
        // ==========================================

        if (
          typeof session.currentQuestion ===
          "number"
        ) {
          setCurrentQuestion(
            session.currentQuestion
          );
        }

        // ==========================================
        // ЗАВЕРШЕННЯ
        // ==========================================

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

    // Перша перевірка одразу
    checkSession();

    // Потім кожні 2 секунди
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

  // ==========================================
  // Поки перша перевірка не завершилася
  // ==========================================

  if (checking) {
    return null;
  }

  // ==========================================
  // ЗАБЛОКОВАНО
  // ==========================================

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