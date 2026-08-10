"use client";

import { useEffect, useState } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

type SessionState = {
  blocked: boolean;
  blockReason: string | null;
  timeLeft: number;
  extraTime: number;
  finished: boolean;
};

export default function SessionMonitor() {
  const {
    test,
    timeLeft,
    setTimeLeft,
    stopTimer,
  } = useTestSession();

  const [blocked, setBlocked] =
    useState(false);

  const [blockReason, setBlockReason] =
    useState<string | null>(null);

  const [checking, setChecking] =
    useState(true);
const [lastServerTime, setLastServerTime] =
  useState<number | null>(null);
  useEffect(() => {
  if (!test?.id) {
    return;
  }

  const testId = test.id;

  let cancelled = false;

  async function checkSession() {
    try {
      const response = await fetch(
        `/api/session/${testId}`,
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

      // ==========================
      // Перевірка блокування
      // ==========================

      if (session.blocked) {
        setBlocked(true);

        setBlockReason(
          session.blockReason ||
            "Тестування заблоковано через порушення правил тестування"
        );

        stopTimer();
      } else {
        setBlocked(false);
        setBlockReason(null);
      }

      // ==========================
      // Синхронізація таймера
      // ==========================

      if (
  typeof session.timeLeft ===
  "number"
) {
  setLastServerTime(
    session.timeLeft
  );

  setTimeLeft(
    session.timeLeft
  );
}

      // ==========================
      // Завершення
      // ==========================

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

  // Подальші перевірки кожні 5 секунд
  const interval = setInterval(
    checkSession,
    5000
  );

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, [
  test,
  setTimeLeft,
  stopTimer,
]);

  // ==================================
  // Поки сесія ще перевіряється
  // ==================================

  if (checking) {
    return null;
  }

  // ==================================
  // Тест заблоковано
  // ==================================

  if (blocked) {
    return (
      <div
        className="
          fixed
          inset-0
          z-[9999]
          flex
          items-center
          justify-center
          bg-black/80
          p-6
        "
      >
        <div
          className="
            w-full
            max-w-xl
            rounded-2xl
            bg-white
            p-8
            text-center
            shadow-2xl
          "
        >
          <div
            className="
              mx-auto
              mb-6
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-full
              bg-red-100
              text-4xl
            "
          >
            🔒
          </div>

          <h1
            className="
              text-3xl
              font-bold
              text-red-700
            "
          >
            Тестування заблоковано
          </h1>

          <p
            className="
              mt-5
              text-lg
              leading-relaxed
              text-gray-700
            "
          >
            {blockReason ||
              "Тестування заблоковано через порушення правил тестування."}
          </p>

          <div
            className="
              mt-6
              rounded-lg
              bg-gray-100
              p-4
              text-sm
              text-gray-600
            "
          >
            Подальше виконання завдань
            тимчасово недоступне.
          </div>
        </div>
      </div>
    );
  }

  return null;
}