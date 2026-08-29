"use client";

import { useEffect, useRef, useState } from "react";

import MonitoringQuestions from "./MonitoringQuestions";

type Props = {
  testId: number;
  sessionId: number;

  totalQuestions: number;

  questionIds: number[];

  initialTimeLeft: number;
  initialExtraTime: number;

  initialBlocked: boolean;
  initialBlockReason: string | null;

  initialFinished: boolean;

  initialCurrentQuestion: number;

  initialSavedAnswers: Record<
    number,
    number[]
  >;
};

// =====================================================
// СТАН СЕСІЇ, ЯКИЙ ПОВЕРТАЄ API
// =====================================================

type SessionState = {
  id: number;

  currentQuestion: number;

  savedAnswers:
    | Record<number, number[]>
    | null;

  blocked: boolean;

  blockReason: string | null;

  timeLeft: number;

  extraTime: number;

  finished: boolean;

  finishedAt: string | null;

  resultId?: number | null;
};

// =====================================================
// ФОРМАТУВАННЯ ЧАСУ
// =====================================================

function formatTime(seconds: number) {
  const normalized = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours = Math.floor(
    normalized / 3600
  );

  const minutes = Math.floor(
    (normalized % 3600) / 60
  );

  const remainingSeconds =
    normalized % 60;

  if (hours > 0) {
    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

// =====================================================
// КОМПОНЕНТ
// =====================================================

export default function MonitoringSessionState({
  testId,
  sessionId,
  totalQuestions,
  questionIds,

  initialTimeLeft,
  initialExtraTime,

  initialBlocked,
  initialBlockReason,

  initialFinished,
  initialCurrentQuestion,

  initialSavedAnswers,
}: Props) {
  // =====================================================
  // ПОТОЧНЕ ПИТАННЯ
  // =====================================================

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(
    Math.max(
      0,
      Math.floor(
        initialCurrentQuestion
      )
    )
  );

  // =====================================================
  // ЗБЕРЕЖЕНІ ВІДПОВІДІ
  // =====================================================

  const [
    savedAnswers,
    setSavedAnswers,
  ] = useState<
    Record<number, number[]>
  >(initialSavedAnswers ?? {});

  // =====================================================
  // ЧАС
  //
  // ЦЕ ЛОКАЛЬНИЙ DISPLAY COUNTDOWN.
  //
  // Серверний timeLeft НЕ буде
  // перезаписувати його кожні 2 секунди.
  // =====================================================

  const [
    timeLeft,
    setTimeLeft,
  ] = useState(
    Math.max(
      0,
      Math.floor(
        initialTimeLeft
      )
    )
  );

  // =====================================================
  // DEADLINE ТАЙМЕРА
  // =====================================================

  const deadlineRef =
    useRef<number | null>(null);

  // =====================================================
  // ПОПЕРЕДНЄ СЕРВЕРНЕ ЗНАЧЕННЯ
  //
  // Потрібне для визначення:
  //
  // чи змінив адміністратор timeLeft.
  //
  // Якщо значення змінилося не через
  // наш локальний countdown — перебудовуємо
  // deadline.
  // =====================================================

  const serverTimeLeftRef =
    useRef(
      Math.max(
        0,
        Math.floor(
          initialTimeLeft
        )
      )
    );

  // =====================================================
  // ПОПЕРЕДНЄ ВІДОБРАЖЕНЕ ЗНАЧЕННЯ
  //
  // Використовується для синхронізації
  // серверного значення з локальним.
  // =====================================================

  const displayedTimeLeftRef =
    useRef(
      Math.max(
        0,
        Math.floor(
          initialTimeLeft
        )
      )
    );

  // =====================================================
  // ЧИ ЗАПУЩЕНО ЛОКАЛЬНИЙ COUNTDOWN
  // =====================================================

  const timerStartedRef =
    useRef(false);

  // =====================================================
  // ДОДАТКОВИЙ ЧАС
  // =====================================================

  const [
    extraTime,
    setExtraTime,
  ] = useState(
    Math.max(
      0,
      Math.floor(
        initialExtraTime
      )
    )
  );

  // =====================================================
  // БЛОКУВАННЯ
  // =====================================================

  const [
    blocked,
    setBlocked,
  ] = useState(
    initialBlocked
  );

  const [
    blockReason,
    setBlockReason,
  ] = useState<
    string | null
  >(initialBlockReason);

  // =====================================================
  // ЗАВЕРШЕННЯ
  // =====================================================

  const [
    finished,
    setFinished,
  ] = useState(
    initialFinished
  );

  // =====================================================
  // ВІДКРИТТЯ СПИСКУ ПИТАНЬ
  // =====================================================

  const [
    questionsOpen,
    setQuestionsOpen,
  ] = useState(false);

  // =====================================================
  // КІЛЬКІСТЬ ПИТАНЬ
  // =====================================================

  const questionsCount =
    Math.max(
      0,
      Math.floor(
        totalQuestions
      )
    );

  // =====================================================
  // ЗАПУСК ЛОКАЛЬНОГО COUNTDOWN
  //
  // ВАЖЛИВО:
  //
  // Таймер адміністратора НЕ повинен
  // залежати від того, як часто приходить GET.
  //
  // GET тільки синхронізує deadline.
  // =====================================================

  function startLocalCountdown(
    seconds: number
  ) {
    const normalized =
      Math.max(
        0,
        Math.floor(
          Number(seconds) || 0
        )
      );

    if (normalized <= 0) {
      deadlineRef.current =
        null;

      timerStartedRef.current =
        false;

      setTimeLeft(0);

      displayedTimeLeftRef.current =
        0;

      return;
    }

    deadlineRef.current =
      Date.now() +
      normalized * 1000;

    timerStartedRef.current =
      true;

    setTimeLeft(normalized);

    displayedTimeLeftRef.current =
      normalized;
  }

  // =====================================================
  // ЛОКАЛЬНИЙ COUNTDOWN
  //
  // ОНОВЛЮЄМО UI КОЖНУ СЕКУНДУ.
  //
  // 01:00:00
  // 00:59:59
  // 00:59:58
  // ...
  //
  // НІЯКОГО GET ТУТ НЕМАЄ.
  // =====================================================

  useEffect(() => {
    if (
      initialFinished ||
      initialBlocked ||
      initialTimeLeft <= 0
    ) {
      return;
    }

    startLocalCountdown(
      initialTimeLeft
    );

    const interval =
      window.setInterval(() => {
        const deadline =
          deadlineRef.current;

        if (
          deadline === null
        ) {
          return;
        }

        const remaining =
          Math.max(
            0,
            Math.ceil(
              (deadline -
                Date.now()) /
                1000
            )
          );

        setTimeLeft(
          remaining
        );

        displayedTimeLeftRef.current =
          remaining;

        if (
          remaining <= 0
        ) {
          deadlineRef.current =
            null;

          timerStartedRef.current =
            false;
        }
      }, 250);

    return () => {
      window.clearInterval(
        interval
      );

      deadlineRef.current =
        null;

      timerStartedRef.current =
        false;
    };
  }, []);

  // =====================================================
  // ОТРИМАННЯ АКТУАЛЬНОГО СТАНУ СЕСІЇ
  //
  // Кожні 2 секунди.
  //
  // КРИТИЧНО:
  //
  // Ми НЕ робимо:
  //
  // setTimeLeft(data.timeLeft)
  //
  // при кожному GET.
  //
  // Інакше таймер буде стрибати.
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    async function loadSessionState() {
      try {
        const response =
          await fetch(
            `/api/session/${testId}?sessionId=${sessionId}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        if (!response.ok) {
          console.error(
            "MONITORING SESSION GET ERROR:",
            response.status
          );

          return;
        }

        const data =
          (await response.json()) as
            | SessionState
            | null;

        if (
          cancelled ||
          !data
        ) {
          return;
        }

        // =================================================
        // ПОТОЧНЕ ПИТАННЯ
        // =================================================

        if (
          typeof data.currentQuestion ===
            "number" &&
          Number.isInteger(
            data.currentQuestion
          ) &&
          data.currentQuestion >= 0
        ) {
          setCurrentQuestion(
            data.currentQuestion
          );
        }

        // =================================================
        // ЗБЕРЕЖЕНІ ВІДПОВІДІ
        // =================================================

        if (
          data.savedAnswers !==
            null &&
          typeof data.savedAnswers ===
            "object"
        ) {
          setSavedAnswers(
            data.savedAnswers
          );
        } else {
          setSavedAnswers({});
        }

        // =================================================
        // СЕРВЕРНИЙ ЧАС
        //
        // ОСНОВНА ЛОГІКА.
        //
        // Не перезаписуємо countdown,
        // якщо серверне значення відрізняється
        // лише через природне проходження часу.
        //
        // Якщо адміністратор змінив timeLeft,
        // значення буде перебудовано.
        // =================================================

        if (
          typeof data.timeLeft ===
          "number"
        ) {
          const serverTime =
            Math.max(
              0,
              Math.floor(
                data.timeLeft
              )
            );

          const previousServerTime =
            serverTimeLeftRef.current;

          const localDisplayedTime =
            displayedTimeLeftRef.current;

          /*
           * Перше отримання серверного значення.
           */

          if (
            !timerStartedRef.current
          ) {
            serverTimeLeftRef.current =
              serverTime;

            if (
              serverTime > 0 &&
              !data.finished &&
              !data.blocked
            ) {
              startLocalCountdown(
                serverTime
              );
            } else {
              setTimeLeft(
                serverTime
              );

              displayedTimeLeftRef.current =
                serverTime;
            }
          } else {
            /*
             * Визначаємо, чи сервер змінив
             * timeLeft адміністративною дією.
             *
             * Нормальний countdown:
             *
             * server:
             * 3600
             *
             * local:
             * 3598
             *
             * Це НЕ адміністративна зміна.
             *
             * Але якщо було:
             *
             * local:
             * 3598
             *
             * server:
             * 3898
             *
             * це +5 хвилин.
             *
             * Або:
             *
             * local:
             * 3598
             *
             * server:
             * 1800
             *
             * це адміністративна зміна.
             */

            const expectedUpper =
              previousServerTime;

            const naturalLower =
              Math.max(
                0,
                previousServerTime -
                  4
              );

            const isNaturalCountdown =
              serverTime <=
                expectedUpper &&
              serverTime >=
                naturalLower;

            /*
             * Якщо значення сервера
             * суттєво відрізняється від
             * очікуваного countdown —
             * це адміністративна зміна.
             */

            const administrativeChange =
              !isNaturalCountdown &&
              Math.abs(
                serverTime -
                  localDisplayedTime
              ) > 2;

            if (
              administrativeChange
            ) {
              console.log(
                "MONITORING: SERVER TIMER CHANGE",
                {
                  previousServerTime,
                  serverTime,
                  localDisplayedTime,
                }
              );

              startLocalCountdown(
                serverTime
              );
            }
          }

          serverTimeLeftRef.current =
            serverTime;
        }

        // =================================================
        // ДОДАТКОВИЙ ЧАС
        // =================================================

        if (
          typeof data.extraTime ===
          "number"
        ) {
          setExtraTime(
            Math.max(
              0,
              Math.floor(
                data.extraTime
              )
            )
          );
        }

        // =================================================
        // БЛОКУВАННЯ
        // =================================================

        setBlocked(
          Boolean(
            data.blocked
          )
        );

        setBlockReason(
          data.blockReason ?? null
        );

        // =================================================
        // ЗАВЕРШЕННЯ
        // =================================================

        setFinished(
          Boolean(
            data.finished
          )
        );

        // =================================================
        // ЯКЩО ЗАБЛОКОВАНО
        //
        // Зупиняємо локальний countdown.
        // =================================================

        if (
          data.blocked ||
          data.finished
        ) {
          deadlineRef.current =
            null;

          timerStartedRef.current =
            false;
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "MONITORING SESSION STATE ERROR:",
            error
          );
        }
      }
    }

    // =====================================================
    // ПЕРШЕ ЗАВАНТАЖЕННЯ
    // =====================================================

    loadSessionState();

    // =====================================================
    // ОНОВЛЕННЯ КОЖНІ 2 СЕКУНДИ
    // =====================================================

    const interval =
      window.setInterval(
        loadSessionState,
        2000
      );

    return () => {
      cancelled = true;

      window.clearInterval(
        interval
      );
    };
  }, [
    testId,
    sessionId,
  ]);

  // =====================================================
  // НОМЕР ПОТОЧНОГО ПИТАННЯ
  // =====================================================

  const displayedCurrentQuestion =
    questionsCount > 0
      ? Math.min(
          Math.max(
            currentQuestion + 1,
            1
          ),
          questionsCount
        )
      : 0;

  // =====================================================
  // КІЛЬКІСТЬ ЗБЕРЕЖЕНИХ ВІДПОВІДЕЙ
  // =====================================================

  const savedQuestionsCount =
    questionIds.filter(
      (questionId) =>
        savedAnswers[
          questionId
        ] !== undefined
    ).length;

  // =====================================================
  // UI
  // =====================================================

  return (
    <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">

      {/* =================================================
          ЗАГОЛОВОК
      ================================================= */}

      <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
        Поточний стан
      </h2>

      {/* =================================================
          ОСНОВНІ ПОКАЗНИКИ
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* =================================================
            ПОТОЧНЕ ПИТАННЯ
        ================================================= */}

        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <div className="text-sm text-gray-500">
            Поточне питання
          </div>

          <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {displayedCurrentQuestion >
            0
              ? `№${displayedCurrentQuestion}`
              : "—"}
          </div>
        </div>

        {/* =================================================
            ПЕРЕГЛЯД ПИТАНЬ
        ================================================= */}

        <div className="rounded-lg bg-gray-50 p-5">
          <div className="text-center text-sm text-gray-500">
            Питання тесту
          </div>

          <button
            type="button"
            onClick={() =>
              setQuestionsOpen(
                (
                  previous
                ) =>
                  !previous
              )
            }
            className="
              mt-3
              w-full
              rounded-lg
              bg-[#7A1F2B]
              px-5
              py-3
              font-semibold
              text-white
              transition
              hover:bg-[#651923]
            "
          >
            {questionsOpen
              ? "Сховати питання"
              : "Переглянути питання"}
          </button>
        </div>

        {/* =================================================
            ЗАЛИШОК ЧАСУ
        ================================================= */}

        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <div className="text-sm text-gray-500">
            Залишилось часу
          </div>

          <div className="mt-2 font-mono text-3xl font-bold text-[#7A1F2B]">
            {formatTime(
              timeLeft
            )}
          </div>
        </div>

        {/* =================================================
            ДОДАТКОВИЙ ЧАС
        ================================================= */}

        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <div className="text-sm text-gray-500">
            Додатковий час
          </div>

          <div className="mt-2 font-mono text-3xl font-bold text-[#7A1F2B]">
            {formatTime(
              extraTime
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          СПИСОК ПИТАНЬ
      ================================================= */}

      {questionsOpen && (
        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-5">

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <h3 className="text-lg font-bold text-gray-800">
              Перелік питань
            </h3>

            <div className="text-sm text-gray-500">
              Збережено:{" "}
              {
                savedQuestionsCount
              }{" "}
              із{" "}
              {questionsCount}
            </div>
          </div>

          <MonitoringQuestions
            totalQuestions={
              questionsCount
            }
            questionIds={
              questionIds
            }
            currentQuestion={
              currentQuestion
            }
            savedAnswers={
              savedAnswers
            }
          />
        </div>
      )}

      {/* =================================================
          БЛОКУВАННЯ
      ================================================= */}

      {blocked && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">

          <div className="font-bold text-red-700">
            Тестування заблоковано
          </div>

          {blockReason && (
            <div className="mt-1 text-sm text-red-600">
              Причина:{" "}
              {blockReason}
            </div>
          )}
        </div>
      )}

      {/* =================================================
          ЗАВЕРШЕННЯ
      ================================================= */}

      {finished && (
        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">

          <div className="font-bold text-gray-700">
            Тестування завершено
          </div>
        </div>
      )}
    </section>
  );
}