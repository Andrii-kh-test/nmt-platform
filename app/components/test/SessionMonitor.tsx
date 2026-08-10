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
};

export default function SessionMonitor() {
  const {
    test,
    sessionId,
    timeLeft,
    setTimeLeft,
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

    // =====================================================
    // Перевірка стану сесії
    // =====================================================

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
          return;
        }

        const session: SessionState | null =
          await response.json();

        if (!session || cancelled) {
          return;
        }

        // =================================================
        // Перевірка блокування
        // =================================================

        if (session.blocked) {
          setBlocked(true);

          setBlockReason(
            session.blockReason ||
              "Тестування заблоковано через порушення правил тестування."
          );

          stopTimer();
        } else {
          setBlocked(false);
          setBlockReason(null);
        }

        // =================================================
        // Синхронізація таймера
        // =================================================

        if (
          typeof session.timeLeft === "number"
        ) {
          setTimeLeft(session.timeLeft);
        }

        // =================================================
        // Завершення
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
    // Heartbeat
    // =====================================================

    async function sendHeartbeat() {
      try {
        await fetch(`/api/session/${testId}`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            sessionId: currentSessionId,
            heartbeat: true,
          }),
        });
      } catch (error) {
        console.error(
          "Помилка heartbeat:",
          error
        );
      }
    }

    // Перша перевірка одразу
    checkSession();

    // Перший heartbeat одразу
    sendHeartbeat();

    // Перевірка стану кожні 5 секунд
    const checkInterval = setInterval(
      checkSession,
      5000
    );

    // Heartbeat кожні 10 секунд
    const heartbeatInterval = setInterval(
      sendHeartbeat,
      10000
    );

    return () => {
      cancelled = true;

      clearInterval(checkInterval);
      clearInterval(heartbeatInterval);
    };
  }, [
    test,
    sessionId,
    setTimeLeft,
    stopTimer,
  ]);

  // =====================================================
  // Поки сесія перевіряється
  // =====================================================

  if (checking) {
    return null;
  }

  // =====================================================
  // Тест заблоковано
  // =====================================================

  if (blocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-10 text-center shadow-2xl">
          <div className="text-6xl">
            🔒
          </div>

          <h1 className="mt-6 text-3xl font-bold text-red-700">
            Тестування заблоковано
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-gray-700">
            {blockReason ||
              "Тестування заблоковано через порушення правил тестування."}
          </p>

          <div className="mt-6 rounded-lg bg-gray-100 p-4 text-sm text-gray-600">
            Подальше виконання завдань
            тимчасово недоступне.
          </div>
        </div>
      </div>
    );
  }

  return null;
}