"use client";

import { useEffect, useState } from "react";

type Props = {
  testId: number;
  sessionId: number;

  totalQuestions: number;

  initialTimeLeft: number;
  initialExtraTime: number;
  initialBlocked: boolean;
  initialBlockReason: string | null;
  initialFinished: boolean;
};

type SessionState = {
  id: number;
  currentQuestion: number;
  blocked: boolean;
  blockReason: string | null;
  timeLeft: number;
  extraTime: number;
  finished: boolean;
  finishedAt: string | null;
  resultId?: number | null;
};

function formatTime(seconds: number) {
  if (seconds <= 0) {
    return "00:00";
  }

  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const remainingSeconds =
    seconds % 60;

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

export default function MonitoringSessionState({
  testId,
  sessionId,
  totalQuestions,
  initialTimeLeft,
  initialExtraTime,
  initialBlocked,
  initialBlockReason,
  initialFinished,
}: Props) {
  // =====================================================
  // АКТУАЛЬНЕ ПОТОЧНЕ ПИТАННЯ
  //
  // currentQuestion зберігається в БД з нуля:
  //
  // 0 = питання №1
  // 1 = питання №2
  // 2 = питання №3
  //
  // Моніторинг тільки читає це значення.
  // Самостійно його не змінює.
  // =====================================================

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0);

  // =====================================================
  // ЧАС
  // =====================================================

  const [timeLeft, setTimeLeft] =
    useState(initialTimeLeft);

  const [extraTime, setExtraTime] =
    useState(initialExtraTime);

  // =====================================================
  // СТАН СЕСІЇ
  // =====================================================

  const [blocked, setBlocked] =
    useState(initialBlocked);

  const [blockReason, setBlockReason] =
    useState(initialBlockReason);

  const [finished, setFinished] =
    useState(initialFinished);

  // =====================================================
  // СПИСОК ПИТАНЬ
  // =====================================================

  const [
    questionsOpen,
    setQuestionsOpen,
  ] = useState(false);

  // =====================================================
  // LIVE-ОНОВЛЕННЯ СТАНУ СЕСІЇ
  //
  // Кожні 2 секунди отримуємо актуальний стан
  // безпосередньо з БД.
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
        //
        // КЛЮЧОВЕ ВИПРАВЛЕННЯ:
        //
        // Беремо актуальне currentQuestion з API.
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
        // ЧАС
        // =================================================

        setTimeLeft(
          Math.max(
            0,
            Math.floor(
              data.timeLeft
            )
          )
        );

        setExtraTime(
          Math.max(
            0,
            Math.floor(
              data.extraTime
            )
          )
        );

        // =================================================
        // БЛОКУВАННЯ
        // =================================================

        setBlocked(
          data.blocked
        );

        setBlockReason(
          data.blockReason
        );

        // =================================================
        // ЗАВЕРШЕННЯ
        // =================================================

        setFinished(
          data.finished
        );
      } catch (error) {
        console.error(
          "MONITORING SESSION STATE ERROR:",
          error
        );
      }
    }

    // ===================================================
    // ПЕРШЕ ЗАВАНТАЖЕННЯ
    // ===================================================

    loadSessionState();

    // ===================================================
    // LIVE POLLING
    // ===================================================

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
  // НОМЕР ПОТОЧНОГО ПИТАННЯ ДЛЯ ВІДОБРАЖЕННЯ
  //
  // Захист від некоректного значення.
  // =====================================================

  const displayedQuestion =
    questionsCount > 0
      ? Math.min(
          Math.max(
            currentQuestion + 1,
            1
          ),
          questionsCount
        )
      : 0;

  return (
    <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
      <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
        Поточний стан
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* =================================================
            ПОТОЧНЕ ПИТАННЯ
        ================================================= */}

        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <div className="text-sm text-gray-500">
            Поточне питання
          </div>

          <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {displayedQuestion > 0
              ? `№ ${displayedQuestion}`
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
                (previous) =>
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

          <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {formatTime(
              extraTime
            )}
          </div>
        </div>
      </div>

      {/* ===================================================
          СПИСОК ПИТАНЬ
      =================================================== */}

      {questionsOpen && (
        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h3 className="mb-4 text-lg font-bold text-gray-800">
            Перелік питань
          </h3>

          {questionsCount > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from(
                {
                  length:
                    questionsCount,
                },
                (_, index) => {
                  const isCurrent =
                    index ===
                    currentQuestion;

                  return (
                    <div
                      key={index}
                      className={`
                        rounded-lg
                        border
                        px-4
                        py-3
                        text-center
                        font-medium
                        transition
                        ${
                          isCurrent
                            ? "border-[#7A1F2B] bg-[#fff1f3] text-[#7A1F2B]"
                            : "border-gray-200 bg-white text-gray-700"
                        }
                      `}
                    >
                      Питання №{" "}
                      {index + 1}

                      {isCurrent && (
                        <div className="mt-1 text-xs font-semibold text-[#7A1F2B]">
                          Поточне
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
              Питання відсутні.
            </div>
          )}
        </div>
      )}

      {/* ===================================================
          БЛОКУВАННЯ
      =================================================== */}

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

      {/* ===================================================
          ЗАВЕРШЕННЯ
      =================================================== */}

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