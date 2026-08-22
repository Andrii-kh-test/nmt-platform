"use client";

import { useEffect, useState } from "react";

import MonitoringQuestions from "./MonitoringQuestions";

type Props = {
  testId: number;
  sessionId: number;

  totalQuestions: number;

  // =====================================================
  // РЕАЛЬНІ ID ПИТАНЬ
  //
  // Наприклад:
  //
  // [17, 21, 25, 31, 44]
  //
  // Це НЕ номери питань.
  // Це id записів Question у БД.
  // =====================================================

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

function formatTime(
  seconds: number
) {
  const normalized =
    Math.max(
      0,
      Math.floor(seconds)
    );

  const hours =
    Math.floor(
      normalized / 3600
    );

  const minutes =
    Math.floor(
      (normalized % 3600) / 60
    );

  const remainingSeconds =
    normalized % 60;

  if (hours > 0) {
    return `${String(
      hours
    ).padStart(
      2,
      "0"
    )}:${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(
    minutes
  ).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(
    2,
    "0"
  )}`;
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
  //
  // У БД:
  //
  // 0 = питання №1
  // 1 = питання №2
  // 2 = питання №3
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
  //
  // КЛЮЧІ — РЕАЛЬНІ question.id
  //
  // Наприклад:
  //
  // {
  //   "17": [2],
  //   "21": [1, 3],
  //   "25": [4]
  // }
  // =====================================================

  const [
    savedAnswers,
    setSavedAnswers,
  ] = useState<
    Record<number, number[]>
  >(
    initialSavedAnswers ?? {}
  );

  // =====================================================
  // ЧАС
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
  >(
    initialBlockReason
  );

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
  // ОТРИМАННЯ АКТУАЛЬНОГО СТАНУ СЕСІЇ
  //
  // Кожні 2 секунди отримуємо стан із сервера.
  //
  // GET нічого не змінює в БД.
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
        //
        // КРИТИЧНО:
        //
        // data.savedAnswers має ключі:
        //
        // question.id
        //
        // а НЕ порядкові номери питань.
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
        // ЧАС
        // =================================================

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
          data.blockReason ??
            null
        );

        // =================================================
        // ЗАВЕРШЕННЯ
        // =================================================

        setFinished(
          Boolean(
            data.finished
          )
        );
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
  // НОМЕР ПОТОЧНОГО ПИТАННЯ ДЛЯ ВІДОБРАЖЕННЯ
  //
  // 0 → №1
  // 1 → №2
  // 2 → №3
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
  //
  // ВАЖЛИВО:
  //
  // Рахуємо тільки ті ключі savedAnswers,
  // які відповідають реальним question.id
  // цього тесту.
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

          {/* ===============================================
              ЗАГОЛОВОК СПИСКУ
          =============================================== */}

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

          {/* ===============================================
              ПИТАННЯ
          =============================================== */}

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