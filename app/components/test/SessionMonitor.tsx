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
  } = useTestSession();

  const [blocked, setBlocked] =
    useState(false);

  const [blockReason, setBlockReason] =
    useState<string | null>(null);

  const [checking, setChecking] =
    useState(true);

  // =====================================================
  // Поточні значення з React.
  //
  // Зберігаємо їх у ref, щоб interval не потрібно
  // було перебудовувати після кожної зміни таймера
  // або поточного питання.
  // =====================================================

  const timeLeftRef =
    useRef(timeLeft);

  const currentQuestionRef =
    useRef(currentQuestion);

  useEffect(() => {
    timeLeftRef.current =
      timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    currentQuestionRef.current =
      currentQuestion;
  }, [currentQuestion]);

  // =====================================================
  // Захист від одночасних запитів
  // =====================================================

  const requestInProgressRef =
    useRef(false);

  // =====================================================
  // Чи вже виконано redirect після завершення
  // =====================================================

  const redirectingRef =
    useRef(false);

  // =====================================================
  // Періодична синхронізація
  // =====================================================

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

      if (requestInProgressRef.current) {
        return;
      }

      requestInProgressRef.current =
        true;

      try {
        // =================================================
        // 1. Отримуємо актуальну сесію із сервера
        // =================================================

        const response =
          await fetch(
            `/api/session/${testId}?sessionId=${currentSessionId}`,
            {
              method: "GET",
              cache: "no-store",
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
        //
        // Сервер є головним джерелом timeLeft.
        //
        // Це критично важливо для функції:
        //
        // Адмін:
        // +10 хвилин
        //
        // БД:
        // timeLeft = старий час + 600
        //
        // Учасник:
        // отримує нове значення через GET
        // і встановлює його локальному таймеру.
        //
        // ВАЖЛИВО:
        // ми НЕ відправляємо timeLeft назад через POST.
        // =================================================

        if (
          typeof session.timeLeft ===
          "number"
        ) {
          const serverTime =
            Math.max(
              0,
              Math.floor(
                session.timeLeft
              )
            );

          const localTime =
            Math.max(
              0,
              Math.floor(
                timeLeftRef.current
              )
            );

          // -------------------------------------------------
          // Встановлюємо серверне значення.
          //
          // Невелика різниця в 1–2 секунди є нормальною:
          // сервер і локальний interval працюють незалежно.
          //
          // Але якщо адміністратор змінив час,
          // наприклад:
          //
          // 1200 -> 1800
          //
          // нове значення обов'язково потрапить
          // у локальний таймер.
          // -------------------------------------------------

          if (
            Math.abs(
              serverTime - localTime
            ) > 1
          ) {
            setTimeLeft(
              serverTime
            );
          }
        }

        // =================================================
        // 4. СИНХРОНІЗАЦІЯ ПОТОЧНОГО ПИТАННЯ
        //
        // Адміністративна панель повинна бачити,
        // яке питання зараз проходить учасник.
        // =================================================

        if (
          typeof session.currentQuestion ===
          "number" &&
          Number.isInteger(
            session.currentQuestion
          ) &&
          session.currentQuestion >= 0
        ) {
          if (
            session.currentQuestion !==
            currentQuestionRef.current
          ) {
            setCurrentQuestion(
              session.currentQuestion
            );
          }
        }

        // =================================================
        // 5. ОНОВЛЮЄМО СЕСІЮ НА СЕРВЕРІ
        //
        // ВАЖЛИВО:
        //
        // Тут НЕ передаємо:
        //
        // timeLeft
        // extraTime
        // blocked
        // blockReason
        //
        // Інакше браузер може перезаписати
        // адміністративну зміну часу.
        // =================================================

        const questionToSave =
          currentQuestionRef.current;

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
              }),
            }
          );

        if (!saveResponse.ok) {
          console.error(
            "SessionMonitor POST error:",
            saveResponse.status
          );
        }

        // =================================================
        // 6. ЗАВЕРШЕННЯ СЕСІЇ
        // =================================================

        if (session.finished) {
          stopTimer();

          // ------------------------------------------------
          // Не запускаємо повторний redirect.
          // ------------------------------------------------

          if (
            !redirectingRef.current
          ) {
            redirectingRef.current =
              true;

            /*
             * Звичайне завершення через finishTest()
             * вже виконує router.replace("/result/ID").
             *
             * Якщо ж сесію завершив адміністратор
             * через "Анулювати результат", result ID
             * потрібно отримати окремим API-запитом.
             *
             * Поки що зупиняємо тестування.
             */
          }
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
    // Перша перевірка одразу після появи sessionId
    // =====================================================

    checkAndSyncSession();

    // =====================================================
    // Подальша синхронізація кожні 2 секунди
    // =====================================================

    const interval =
      setInterval(
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
    setTimeLeft,
    setCurrentQuestion,
    stopTimer,
  ]);

  // =====================================================
  // Поки виконується перша перевірка
  // =====================================================

  if (checking) {
    return null;
  }

  // =====================================================
  // СЕСІЯ ЗАБЛОКОВАНА
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