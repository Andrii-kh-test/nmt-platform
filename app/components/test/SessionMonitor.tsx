"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useTestSession } from "@/app/context/TestSessionContext";

type SessionState = {
  id: number;

  blocked: boolean;

  blockReason: string | null;

  timeLeft: number;

  extraTime: number;

  finished: boolean;

  currentQuestion: number;

  resultId?: number | null;
};

export default function SessionMonitor() {
  const router = useRouter();

  const {
    test,
    sessionId,

    timeLeft,
    setTimeLeft,

    currentQuestion,
    setCurrentQuestion,

    stopTimer,
    startTimer,
  } = useTestSession();

  // =====================================================
  // Стан блокування
  // =====================================================

  const [blocked, setBlocked] =
    useState(false);

  const [blockReason, setBlockReason] =
    useState<string | null>(null);

  // =====================================================
  // Стан первинної перевірки
  // =====================================================

  const [checking, setChecking] =
    useState(true);

  // =====================================================
  // Останній серверний час
  //
  // ВАЖЛИВО:
  //
  // Ми НЕ записуємо локальний timeLeft назад
  // на сервер.
  //
  // Цей ref потрібен лише для визначення,
  // чи змінився час на сервері.
  // =====================================================

  const lastServerTimeRef =
    useRef<number | null>(null);

  // =====================================================
  // Захист від одночасних запитів
  // =====================================================

  const requestInProgressRef =
    useRef(false);

  // =====================================================
  // Захист від повторного переходу
  // на сторінку результату
  // =====================================================

  const resultRedirectedRef =
    useRef(false);

  // =====================================================
  // Зберігаємо актуальний локальний час
  //
  // Це потрібно, щоб callback interval
  // не працював із застарілим значенням.
  // =====================================================

  const timeLeftRef =
    useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current =
      timeLeft;
  }, [timeLeft]);

  // =====================================================
  // Зберігаємо актуальне поточне питання
  // =====================================================

  const currentQuestionRef =
    useRef(currentQuestion);

  useEffect(() => {
    currentQuestionRef.current =
      currentQuestion;
  }, [currentQuestion]);

  // =====================================================
  // Основний моніторинг
  //
  // ВАЖЛИВО:
  //
  // effect НЕ залежить від timeLeft.
  //
  // Інакше кожна секунда створювала б новий
  // цикл моніторингу.
  // =====================================================

  useEffect(() => {
    if (!test?.id || !sessionId) {
      setChecking(false);

      return;
    }

    const testId = test.id;

    const currentSessionId =
      sessionId;

    let cancelled = false;

    // ===================================================
    // Перевірка сесії
    // ===================================================

    async function checkSession() {
      if (cancelled) {
        return;
      }

      if (
        requestInProgressRef.current
      ) {
        return;
      }

      requestInProgressRef.current =
        true;

      try {
        // ===============================================
        // GET актуального стану
        // ===============================================

        const response =
          await fetch(
            `/api/session/${testId}?sessionId=${currentSessionId}`,
            {
              method: "GET",

              cache: "no-store",

              headers: {
                "Cache-Control":
                  "no-cache",
              },
            }
          );

        if (!response.ok) {
          console.error(
            "SessionMonitor GET error:",
            response.status
          );

          return;
        }

        const session:
          | SessionState
          | null =
          await response.json();

        if (!session || cancelled) {
          return;
        }

        console.log(
          "SESSION MONITOR:",
          session
        );

        // ===============================================
        // 1. ЗАВЕРШЕННЯ СЕСІЇ
        //
        // Це перевіряємо ПЕРШИМ.
        //
        // Бо після анулювання:
        //
        // finished = true
        // blocked = true
        //
        // але учасник повинен перейти
        // на результат, а не побачити
        // екран блокування.
        // ===============================================

        if (session.finished) {
          stopTimer();

          // ---------------------------------------------
          // Якщо API вже повернув resultId
          // ---------------------------------------------

          if (
            session.resultId &&
            Number.isInteger(
              session.resultId
            ) &&
            session.resultId > 0
          ) {
            if (
              !resultRedirectedRef.current
            ) {
              resultRedirectedRef.current =
                true;

              router.replace(
                `/result/${session.resultId}`
              );
            }

            return;
          }

          // ---------------------------------------------
          // Якщо resultId ще не прийшов
          //
          // Не показуємо блокування.
          // Продовжуємо перевіряти сервер.
          // ---------------------------------------------

          setBlocked(false);
          setBlockReason(null);

          return;
        }

        // ===============================================
        // 2. БЛОКУВАННЯ
        // ===============================================

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

        // ===============================================
        // 3. СИНХРОНІЗАЦІЯ ПОТОЧНОГО ПИТАННЯ
        // ===============================================

        if (
          typeof session.currentQuestion ===
            "number" &&
          Number.isInteger(
            session.currentQuestion
          ) &&
          session.currentQuestion >= 0
        ) {
          const serverQuestion =
            session.currentQuestion;

          if (
            serverQuestion !==
            currentQuestionRef.current
          ) {
            currentQuestionRef.current =
              serverQuestion;

            setCurrentQuestion(
              serverQuestion
            );
          }
        }

        // ===============================================
        // 4. СИНХРОНІЗАЦІЯ ЧАСУ
        //
        // Серверне значення використовується
        // тільки тоді, коли воно реально змінилося.
        //
        // Наприклад:
        //
        // сервер: 1800
        // локально: 1799
        //
        // це нормальний відлік.
        //
        // Але:
        //
        // сервер: 1800
        // локально: 1790
        //
        // сервер змінився суттєво —
        // синхронізуємо.
        // ===============================================

        if (
          typeof session.timeLeft ===
            "number" &&
          Number.isFinite(
            session.timeLeft
          )
        ) {
          const serverTime =
            Math.max(
              0,
              Math.floor(
                session.timeLeft
              )
            );

          const previousServerTime =
            lastServerTimeRef.current;

          // ---------------------------------------------
          // Перша синхронізація
          // ---------------------------------------------

          if (
            previousServerTime ===
            null
          ) {
            lastServerTimeRef.current =
              serverTime;

            timeLeftRef.current =
              serverTime;

            setTimeLeft(serverTime);

            if (
              serverTime > 0 &&
              !session.blocked
            ) {
              startTimer();
            }
          } else {
            const difference =
              Math.abs(
                serverTime -
                  previousServerTime
              );

            // -------------------------------------------
            // Якщо серверне значення змінилося
            // більше ніж на 2 секунди.
            //
            // Це означає, що:
            //
            // + адміністратор додав час;
            // або
            // + сервер змінив час.
            // -------------------------------------------

            if (difference > 2) {
              lastServerTimeRef.current =
                serverTime;

              timeLeftRef.current =
                serverTime;

              setTimeLeft(
                serverTime
              );

              if (
                serverTime > 0 &&
                !session.blocked
              ) {
                startTimer();
              }

              console.log(
                "SERVER TIME SYNCHRONIZED:",
                {
                  previous:
                    previousServerTime,

                  current:
                    serverTime,
                }
              );
            } else {
              // -----------------------------------------
              // Нормальний локальний відлік.
              //
              // НЕ викликаємо setTimeLeft().
              // -----------------------------------------

              lastServerTimeRef.current =
                serverTime;
            }
          }
        }
      } catch (error) {
        console.error(
          "Помилка моніторингу сесії:",
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

    // ===================================================
    // Перша перевірка одразу
    // ===================================================

    checkSession();

    // ===================================================
    // Подальші перевірки кожні 2 секунди
    // ===================================================

    const interval =
      setInterval(
        checkSession,
        2000
      );

    // ===================================================
    // Cleanup
    // ===================================================

    return () => {
      cancelled = true;

      clearInterval(interval);

      requestInProgressRef.current =
        false;
    };
  }, [
    test?.id,
    sessionId,
    setTimeLeft,
    setCurrentQuestion,
    stopTimer,
    startTimer,
    router,
  ]);

  // =====================================================
  // Якщо часу залишилося 0
  // =====================================================

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    timeLeftRef.current =
      timeLeft;
  }, [timeLeft]);

  // =====================================================
  // Поки не отримали перший стан
  // =====================================================

  if (checking) {
    return null;
  }

  // =====================================================
  // ЗАБЛОКОВАНО
  //
  // ВАЖЛИВО:
  //
  // finished перевіряється вище.
  //
  // Тому анульована сесія сюди
  // не повинна потрапляти.
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
            Подальше виконання
            завдань недоступне.
          </div>
        </div>
      </div>
    );
  }

  return null;
}