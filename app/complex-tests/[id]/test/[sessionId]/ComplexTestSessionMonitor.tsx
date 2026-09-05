"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useComplexTestSession } from "@/app/context/ComplexTestSessionContext";

interface ComplexSessionMonitorProps {
  complexTestId: number;
  sessionId: number;
  pollInterval?: number;
  heartbeatInterval?: number;
}

interface SessionResponse {
  success: boolean;
  message?: string;

  session?: {
    id: number;
    complexTestId: number;
    participantId: number | null;

    currentTestId: number | null;
    currentQuestion: number;

    savedAnswers: Record<
      number,
      Record<number, number[]>
    >;

    timeLeft: number;
    extraTime: number;

    finished: boolean;
    finishedAt: string | null;

    blocked: boolean;
    blockReason: string | null;
    blockedAt: string | null;

    startedAt: string | null;
  };
}

export default function ComplexTestSessionMonitor({
  complexTestId,
  sessionId,
  pollInterval = 5000,
  heartbeatInterval = 10000,
}: ComplexSessionMonitorProps) {
  const router = useRouter();

  const {
    restoreSession,
    setBlocked,
    setFinished,
    timeLeft,
    blocked,
    finished,
    currentTestId,
    currentQuestion,
    savedAnswers,
  } = useComplexTestSession();

  const previousServerTimeRef =
    useRef<number | null>(null);

  const mountedRef = useRef(true);

  const syncingRef = useRef(false);

  /*
   * Захищаємося від повторного автоматичного
   * завершення, якщо одночасно спрацює кілька
   * countdown / polling подій.
   */

  const finishingRef = useRef(false);

  /*
   * =========================================================
   * АВТОМАТИЧНЕ ЗАВЕРШЕННЯ ПРИ ЗАКІНЧЕННІ ЧАСУ
   * =========================================================
   */

  async function finishByTimeout() {
    if (
      !mountedRef.current ||
      finishingRef.current ||
      finished ||
      blocked
    ) {
      return;
    }

    finishingRef.current = true;

    try {
      const response = await fetch(
        `/api/complex-tests/${complexTestId}/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            sessionId,
            currentTestId,
            currentQuestion,
            savedAnswers,
            finished: true,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Не вдалося автоматично завершити тестування."
        );
      }

      if (!mountedRef.current) {
        return;
      }

      /*
       * Сервер остаточно встановив:
       * finished = true
       * finishedAt = now
       * timeLeft = 0
       */

      setFinished(true);

      router.replace(
        `/complex-tests/${complexTestId}/result/${sessionId}`
      );
    } catch (error) {
      console.error(
        "AUTO FINISH COMPLEX TEST:",
        error
      );

      /*
       * Дозволяємо повторити спробу,
       * якщо через мережеву помилку запит
       * не дійшов до сервера.
       */

      finishingRef.current = false;
    }
  }

  /*
   * =========================================================
   * Основна синхронізація із сервером
   * =========================================================
   */

  async function syncSession(
    force = false
  ) {
    if (!mountedRef.current) {
      return;
    }

    if (syncingRef.current && !force) {
      return;
    }

    syncingRef.current = true;

    try {
      const response = await fetch(
        `/api/complex-tests/${complexTestId}/session?sessionId=${sessionId}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data: SessionResponse =
        await response.json();

      if (
        !mountedRef.current ||
        !data.success ||
        !data.session
      ) {
        return;
      }

      const session = data.session;

      /*
       * -------------------------------------------------------
       * Завершена сесія
       * -------------------------------------------------------
       */

      if (session.finished) {
        setFinished(true);

        restoreSession(
          session.currentTestId,
          session.currentQuestion,
          session.savedAnswers,
          session.timeLeft,
          session.startedAt,
          true,
          session.blocked,
          session.blockReason
        );

        if (
          session.finishedAt ||
          session.timeLeft <= 0
        ) {
          router.replace(
            `/complex-tests/${complexTestId}/result/${sessionId}`
          );
        }

        return;
      }

      /*
       * -------------------------------------------------------
       * Блокування
       * -------------------------------------------------------
       */

      if (session.blocked) {
        setBlocked(
          true,
          session.blockReason
        );

        restoreSession(
          session.currentTestId,
          session.currentQuestion,
          session.savedAnswers,
          session.timeLeft,
          session.startedAt,
          session.finished,
          true,
          session.blockReason
        );

        return;
      }

      /*
       * -------------------------------------------------------
       * Розблокування
       * -------------------------------------------------------
       */

      if (blocked) {
        setBlocked(false, null);
      }

      /*
       * -------------------------------------------------------
       * Серверний час
       *
       * Серверне значення є авторитетним.
       * Це особливо важливо для адміністративної
       * зміни часу.
       * -------------------------------------------------------
       */

      const serverTime = Math.max(
        0,
        Math.floor(session.timeLeft)
      );

      /*
       * Якщо сервер уже повернув 0 секунд,
       * а finished ще false, не чекаємо наступного
       * polling — одразу завершуємо сесію.
       *
       * Важливо: саме серверне значення 0 є
       * підставою для завершення.
       */

      if (
        serverTime <= 0 &&
        !finishingRef.current
      ) {
        /*
         * Спочатку синхронізуємо локальний стан
         * із сервером.
         */

        restoreSession(
          session.currentTestId,
          session.currentQuestion,
          session.savedAnswers,
          0,
          session.startedAt,
          false,
          false,
          null
        );

        previousServerTimeRef.current = 0;

        /*
         * Після синхронізації просимо сервер
         * остаточно завершити сесію.
         */

        await finishByTimeout();

        return;
      }

      const previousServerTime =
        previousServerTimeRef.current;

      const timeDifference =
        previousServerTime === null
          ? 0
          : Math.abs(
              serverTime -
                previousServerTime
            );

      /*
       * Якщо різниця >= 2 секунд —
       * серверне значення має пріоритет.
       *
       * Це дозволяє коректно підхоплювати
       * адміністративні зміни часу.
       */

      const shouldSynchronizeTime =
        force ||
        previousServerTime === null ||
        timeDifference >= 2;

      if (shouldSynchronizeTime) {
        restoreSession(
          session.currentTestId,
          session.currentQuestion,
          session.savedAnswers,
          serverTime,
          session.startedAt,
          session.finished,
          false,
          null
        );
      }

      /*
       * Запам'ятовуємо саме серверне значення.
       */

      previousServerTimeRef.current =
        serverTime;
    } catch (error) {
      console.error(
        "COMPLEX SESSION SYNC ERROR:",
        error
      );
    } finally {
      syncingRef.current = false;
    }
  }

  /*
   * =========================================================
   * Первинна синхронізація
   * =========================================================
   */

  useEffect(() => {
    mountedRef.current = true;

    syncSession(true);

    return () => {
      mountedRef.current = false;
    };
  }, [
    complexTestId,
    sessionId,
  ]);

  /*
   * =========================================================
   * Polling
   * =========================================================
   */

  useEffect(() => {
    const interval = window.setInterval(() => {
      syncSession(false);
    }, pollInterval);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    complexTestId,
    sessionId,
    pollInterval,
  ]);

  /*
   * =========================================================
   * Heartbeat
   * =========================================================
   *
   * Heartbeat не змінює timeLeft.
   * Його завдання — перевірити, що сесія доступна.
   * =========================================================
   */

  useEffect(() => {
    const heartbeat = window.setInterval(
      async () => {
        if (!mountedRef.current) {
          return;
        }

        try {
          await fetch(
            `/api/complex-tests/${complexTestId}/session`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                sessionId,
                heartbeat: true,
              }),
            }
          );
        } catch (error) {
          console.error(
            "COMPLEX SESSION HEARTBEAT ERROR:",
            error
          );
        }
      },
      heartbeatInterval
    );

    return () => {
      window.clearInterval(heartbeat);
    };
  }, [
    complexTestId,
    sessionId,
    heartbeatInterval,
  ]);

  /*
   * =========================================================
   * Втрата видимості вкладки
   * =========================================================
   */

  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        syncSession(true);
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    complexTestId,
    sessionId,
  ]);

  /*
   * =========================================================
   * Відновлення після втрати мережі
   * =========================================================
   */

  useEffect(() => {
    function handleOnline() {
      syncSession(true);
    }

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );
    };
  }, [
    complexTestId,
    sessionId,
  ]);

  /*
   * =========================================================
   * КОНТРОЛЬ ЛОКАЛЬНОГО ТАЙМЕРА
   * =========================================================
   *
   * Коли локальний countdown доходить до 0,
   * одразу просимо сервер підтвердити актуальний
   * стан і, якщо час справді вичерпано,
   * завершуємо сесію.
   *
   * timeLeft не передається на сервер.
   * =========================================================
   */

  useEffect(() => {
    if (
      timeLeft <= 0 &&
      !finished &&
      !blocked &&
      !finishingRef.current
    ) {
      finishByTimeout();
    }
  }, [
    timeLeft,
    finished,
    blocked,
    currentTestId,
    currentQuestion,
    savedAnswers,
  ]);

  /*
   * Компонент не має власного UI.
   */

  return null;
}