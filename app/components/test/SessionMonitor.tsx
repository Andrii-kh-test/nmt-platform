"use client";

import { useEffect, useRef } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

type SessionResponse = {
  id: number;
  currentQuestion: number;

  savedAnswers:
    | Record<number, number[]>
    | null;

  timeLeft: number;
  extraTime: number;

  finished: boolean;
  blocked: boolean;
  blockReason: string | null;

  resultId?: number | null;
};

export default function SessionMonitor() {
  const {
    sessionId,
    currentQuestion,
    savedAnswers,

    setTimeLeft,
    restoreSession,

    test,
  } = useTestSession();

  // =====================================================
  // STABILЬНИЙ TEST ID
  //
  // Після перевірки test !== null зберігаємо ID окремо.
  //
  // Це:
  // 1. усуває TypeScript-помилку;
  // 2. не дає вкладеним async-функціям працювати
  //    безпосередньо з nullable test.
  // =====================================================

  const testId =
    test?.id ?? null;

  // =====================================================
  // ПОПЕРЕДЖЕННЯ ПРО ПАРАЛЕЛЬНІ ЗАПИТИ
  // =====================================================

  const restoringRef =
    useRef(false);

  const synchronizingRef =
    useRef(false);

  // =====================================================
  // ОСТАННІ УСПІШНО СИНХРОНІЗОВАНІ ДАНІ
  //
  // Зберігаємо не response сервера,
  // а саме payload, який ми відправили.
  // =====================================================

  const lastSentRef =
    useRef<string>("");

  // =====================================================
  // ОСТАННІ ЛОКАЛЬНІ ДАНІ
  //
  // Використовуються для захисту від ситуації,
  // коли старий async-запит повертається після
  // нового стану React.
  // =====================================================

  const latestStateRef =
    useRef({
      sessionId:
        sessionId,

      currentQuestion:
        currentQuestion,

      savedAnswers:
        savedAnswers ?? {},
    });

  // =====================================================
  // ПОСТІЙНО ОНОВЛЮЄМО REF АКТУАЛЬНИМ СТАНОМ
  // =====================================================

  useEffect(() => {
    latestStateRef.current = {
      sessionId,

      currentQuestion,

      savedAnswers:
        savedAnswers ?? {},
    };
  }, [
    sessionId,
    currentQuestion,
    savedAnswers,
  ]);

  // =====================================================
  // СИНХРОНІЗАЦІЯ СТАНУ УЧАСНИКА
  //
  // Надсилаємо:
  // - currentQuestion;
  // - savedAnswers.
  //
  // НЕ надсилаємо:
  // - timeLeft;
  // - extraTime;
  // - blocked;
  // - blockReason;
  // - blockedAt.
  //
  // Це відповідає серверному API.
  // =====================================================

  async function synchronizeSession() {
    const currentSessionId =
      latestStateRef.current.sessionId;

    const currentTestId =
      testId;

    if (
      !currentSessionId ||
      !currentTestId
    ) {
      return;
    }

    if (synchronizingRef.current) {
      return;
    }

    // ---------------------------------------------------
    // Беремо стан саме на момент початку синхронізації.
    // ---------------------------------------------------

    const state =
      latestStateRef.current;

    const payload = {
      sessionId:
        currentSessionId,

      currentQuestion:
        state.currentQuestion,

      savedAnswers:
        state.savedAnswers,
    };

    const serialized =
      JSON.stringify(payload);

    // ---------------------------------------------------
    // Нічого нового не змінилося.
    // ---------------------------------------------------

    if (
      serialized ===
      lastSentRef.current
    ) {
      return;
    }

    synchronizingRef.current =
      true;

    try {
      const response =
        await fetch(
          `/api/session/${currentTestId}`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            cache: "no-store",

            body: JSON.stringify(
              payload
            ),
          }
        );

      if (!response.ok) {
        console.error(
          "SESSION MONITOR POST ERROR:",
          response.status
        );

        return;
      }

      const data =
        (await response.json()) as
          | SessionResponse
          | null;

      if (!data) {
        return;
      }

      // ---------------------------------------------------
      // КРИТИЧНО
      //
      // НЕ робимо:
      //
      // setCurrentQuestion(
      //   data.currentQuestion
      // );
      //
      // і НЕ робимо:
      //
      // restoreSession(...)
      //
      // після звичайного POST.
      //
      // Інакше старий response може відкотити
      // новий стан React.
      // ---------------------------------------------------

      if (
        typeof data.timeLeft ===
        "number"
      ) {
        setTimeLeft(
          Math.max(
            0,
            Math.floor(
              data.timeLeft
            )
          )
        );
      }

      // ---------------------------------------------------
      // Запам'ятовуємо саме payload,
      // який успішно прийняв сервер.
      // ---------------------------------------------------

      lastSentRef.current =
        serialized;
    } catch (error) {
      console.error(
        "SESSION MONITOR ERROR:",
        error
      );
    } finally {
      synchronizingRef.current =
        false;
    }
  }

  // =====================================================
  // ПОЧАТКОВЕ ВІДНОВЛЕННЯ СЕСІЇ
  //
  // GET один раз отримує:
  // - currentQuestion;
  // - savedAnswers;
  // - timeLeft.
  //
  // Після цього Context відновлюється із БД.
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      !testId
    ) {
      return;
    }

    if (restoringRef.current) {
      return;
    }

    let cancelled = false;

    restoringRef.current =
      true;

    const currentSessionId =
      sessionId;

    const currentTestId =
      testId;

    async function restore() {
      try {
        const response =
          await fetch(
            `/api/session/${currentTestId}?sessionId=${currentSessionId}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        if (!response.ok) {
          console.error(
            "SESSION RESTORE HTTP ERROR:",
            response.status
          );

          return;
        }

        const data =
          (await response.json()) as
            | SessionResponse
            | null;

        if (
          cancelled ||
          !data
        ) {
          return;
        }

        const answers =
          data.savedAnswers ?? {};

        // =================================================
        // ВІДНОВЛЮЄМО СТАН ІЗ БД
        // =================================================

        restoreSession(
          data.currentQuestion,
          answers,
          data.timeLeft
        );

        // =================================================
        // Синхронізований стан уже є серверним.
        // =================================================

        lastSentRef.current =
          JSON.stringify({
            sessionId:
              currentSessionId,

            currentQuestion:
              data.currentQuestion,

            savedAnswers:
              answers,
          });
      } catch (error) {
        if (!cancelled) {
          console.error(
            "SESSION RESTORE ERROR:",
            error
          );
        }
      } finally {
        restoringRef.current =
          false;
      }
    }

    restore();

    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    testId,
    restoreSession,
  ]);

  // =====================================================
  // СИНХРОНІЗАЦІЯ ПРИ ЗМІНІ:
  //
  // - currentQuestion;
  // - savedAnswers.
  //
  // Невелика затримка потрібна, щоб React встиг
  // сформувати остаточний стан після натискання.
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      !testId
    ) {
      return;
    }

    if (restoringRef.current) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        synchronizeSession();
      }, 150);

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    sessionId,
    testId,
    currentQuestion,
    savedAnswers,
  ]);

  // =====================================================
  // HEARTBEAT
  //
  // Heartbeat ТІЛЬКИ оновлює lastActivityAt.
  //
  // Ми навмисно НЕ беремо з його response:
  //
  // - currentQuestion;
  // - savedAnswers;
  // - timeLeft.
  //
  // Таким чином heartbeat не може відкотити Context.
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      !testId
    ) {
      return;
    }

    let cancelled = false;

    const currentSessionId =
      sessionId;

    const currentTestId =
      testId;

    async function heartbeat() {
      if (cancelled) {
        return;
      }

      try {
        const response =
          await fetch(
            `/api/session/${currentTestId}`,
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

                heartbeat: true,
              }),
            }
          );

        if (
          !response.ok &&
          !cancelled
        ) {
          console.error(
            "SESSION HEARTBEAT HTTP ERROR:",
            response.status
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "SESSION HEARTBEAT ERROR:",
            error
          );
        }
      }
    }

    // Перше повідомлення.
    heartbeat();

    const interval =
      window.setInterval(
        heartbeat,
        5000
      );

    return () => {
      cancelled = true;

      window.clearInterval(
        interval
      );
    };
  }, [
    sessionId,
    testId,
  ]);

  // =====================================================
  // ПЕРЕД ЗАКРИТТЯМ / ПЕРЕЗАВАНТАЖЕННЯМ
  //
  // sendBeacon передає останній стан.
  // =====================================================

  useEffect(() => {
    if (
      !sessionId ||
      !testId
    ) {
      return;
    }

    const currentTestId =
      testId;

    function handleBeforeUnload() {
      const state =
        latestStateRef.current;

      if (
        !state.sessionId
      ) {
        return;
      }

      const payload = {
        sessionId:
          state.sessionId,

        currentQuestion:
          state.currentQuestion,

        savedAnswers:
          state.savedAnswers,
      };

      try {
        navigator.sendBeacon(
          `/api/session/${currentTestId}`,
          new Blob(
            [
              JSON.stringify(
                payload
              ),
            ],
            {
              type:
                "application/json",
            }
          )
        );
      } catch (error) {
        console.error(
          "SESSION BEFORE UNLOAD ERROR:",
          error
        );
      }
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [
    sessionId,
    testId,
  ]);

  // =====================================================
  // UI ВІДСУТНІЙ
  // =====================================================

  return null;
}