"use client";

import { useEffect, useState } from "react";

type Props = {
  testId: number;
  sessionId: number;
  initialCurrentQuestion: number;
  initialTimeLeft: number;
  initialExtraTime: number;
  initialBlocked: boolean;
  initialBlockReason: string | null;
  initialFinished: boolean;
};

type SessionQuestion = {
  number: number;
  answered: boolean;
};

type SessionState = {
  id: number;
  currentQuestion: number;
  savedAnswers: unknown;
  blocked: boolean;
  blockReason: string | null;
  timeLeft: number;
  extraTime: number;
  finished: boolean;
  finishedAt: string | null;
  resultId?: number | null;
  questions?: SessionQuestion[];
};

function formatTime(seconds: number) {
  if (seconds <= 0) {
    return "00:00";
  }

  const hours = Math.floor(seconds / 3600);

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

/**
 * Перевіряє, чи є відповідь на конкретне питання.
 *
 * Підтримуються основні варіанти структури
 * savedAnswers, які використовуються в тестовій системі:
 *
 * - масив відповідей:
 *   ["A", "B", null, ...]
 *
 * - об'єкт:
 *   {
 *     "0": "A",
 *     "1": "B"
 *   }
 *
 * - об'єкт із масивом:
 *   {
 *     answers: [...]
 *   }
 */
function hasAnswer(
  savedAnswers: unknown,
  questionIndex: number
): boolean {
  if (
    savedAnswers === null ||
    savedAnswers === undefined
  ) {
    return false;
  }

  // -----------------------------------------------
  // Якщо savedAnswers — масив
  // -----------------------------------------------

  if (Array.isArray(savedAnswers)) {
    const answer =
      savedAnswers[questionIndex];

    if (
      answer === null ||
      answer === undefined
    ) {
      return false;
    }

    if (
      typeof answer === "string" &&
      answer.trim() === ""
    ) {
      return false;
    }

    if (
      Array.isArray(answer) &&
      answer.length === 0
    ) {
      return false;
    }

    return true;
  }

  // -----------------------------------------------
  // Якщо savedAnswers — об'єкт
  // -----------------------------------------------

  if (
    typeof savedAnswers === "object"
  ) {
    const object =
      savedAnswers as Record<
        string,
        unknown
      >;

    // Варіант:
    // { answers: [...] }

    if (
      Array.isArray(
        object.answers
      )
    ) {
      const answer =
        object.answers[
          questionIndex
        ];

      if (
        answer === null ||
        answer === undefined
      ) {
        return false;
      }

      if (
        typeof answer === "string" &&
        answer.trim() === ""
      ) {
        return false;
      }

      if (
        Array.isArray(answer) &&
        answer.length === 0
      ) {
        return false;
      }

      return true;
    }

    // Варіант:
    // { "0": "A", "1": "B" }

    const answer =
      object[
        String(questionIndex)
      ];

    if (
      answer === null ||
      answer === undefined
    ) {
      return false;
    }

    if (
      typeof answer === "string" &&
      answer.trim() === ""
    ) {
      return false;
    }

    if (
      Array.isArray(answer) &&
      answer.length === 0
    ) {
      return false;
    }

    return true;
  }

  return false;
}

export default function MonitoringSessionState({
  testId,
  sessionId,
  initialCurrentQuestion,
  initialTimeLeft,
  initialExtraTime,
  initialBlocked,
  initialBlockReason,
  initialFinished,
}: Props) {
  const [currentQuestion, setCurrentQuestion] =
    useState(initialCurrentQuestion);

  const [timeLeft, setTimeLeft] =
    useState(initialTimeLeft);

  const [extraTime, setExtraTime] =
    useState(initialExtraTime);

  const [blocked, setBlocked] =
    useState(initialBlocked);

  const [blockReason, setBlockReason] =
    useState(initialBlockReason);

  const [finished, setFinished] =
    useState(initialFinished);

  const [savedAnswers, setSavedAnswers] =
    useState<unknown>(null);

  const [questionCount, setQuestionCount] =
    useState(0);

  const [questionsOpen, setQuestionsOpen] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSessionState() {
      try {
        const response = await fetch(
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

        setCurrentQuestion(
          data.currentQuestion
        );

        setTimeLeft(
          data.timeLeft
        );

        setExtraTime(
          data.extraTime
        );

        setBlocked(
          data.blocked
        );

        setBlockReason(
          data.blockReason
        );

        setFinished(
          data.finished
        );

        setSavedAnswers(
          data.savedAnswers
        );

        if (
          Array.isArray(
            data.questions
          )
        ) {
          setQuestionCount(
            data.questions.length
          );
        }
      } catch (error) {
        console.error(
          "MONITORING SESSION STATE ERROR:",
          error
        );
      }
    }

    loadSessionState();

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
  }, [testId, sessionId]);

  /**
   * Формуємо список питань.
   *
   * Якщо API вже повернуло questions,
   * questionCount буде встановлений.
   *
   * Якщо questions ще не повертаються,
   * список тимчасово не показується.
   */
  const questions =
    Array.from(
      {
        length: questionCount,
      },
      (_, index) => ({
        number: index + 1,
        answered: hasAnswer(
          savedAnswers,
          index
        ),
      })
    );

  return (
    <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
      <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
        Поточний стан
      </h2>

      {/* =================================================
          ОСНОВНІ ПОКАЗНИКИ
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* ПОТОЧНЕ ПИТАННЯ */}

        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <div className="text-sm text-gray-500">
            Поточне питання
          </div>

          <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {currentQuestion + 1}
          </div>
        </div>

        {/* ЗАЛИШОК ЧАСУ */}

        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <div className="text-sm text-gray-500">
            Залишилось часу
          </div>

          <div className="mt-2 font-mono text-3xl font-bold text-[#7A1F2B]">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* ДОДАТКОВИЙ ЧАС */}

        <div className="rounded-lg bg-gray-50 p-5 text-center">
          <div className="text-sm text-gray-500">
            Додатковий час
          </div>

          <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {formatTime(extraTime)}
          </div>
        </div>
      </div>

      {/* =================================================
          КНОПКА СПИСКУ ПИТАНЬ
      ================================================= */}

      <div className="mt-6">
        <button
          type="button"
          onClick={() =>
            setQuestionsOpen(
              (value) => !value
            )
          }
          className="
            flex
            w-full
            items-center
            justify-between
            rounded-lg
            border
            border-gray-200
            bg-gray-50
            px-5
            py-4
            text-left
            font-semibold
            text-gray-800
            transition
            hover:bg-gray-100
          "
        >
          <span>
            Перелік питань
          </span>

          <span className="text-xl text-[#7A1F2B]">
            {questionsOpen
              ? "▲"
              : "▼"}
          </span>
        </button>
      </div>

      {/* =================================================
          СПИСОК ПИТАНЬ
      ================================================= */}

      {questionsOpen && (
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
          {questions.length === 0 ? (
            <div className="p-5 text-center text-gray-500">
              Інформація про питання
              поки недоступна.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {questions.map(
                (question) => {
                  const isCurrent =
                    question.number -
                      1 ===
                    currentQuestion;

                  return (
                    <div
                      key={
                        question.number
                      }
                      className={`
                        flex
                        items-center
                        justify-between
                        px-5
                        py-4
                        transition
                        ${
                          isCurrent
                            ? "bg-[#7A1F2B]/10"
                            : "bg-white"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* НОМЕР ПИТАННЯ */}

                        <span
                          className={`
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-full
                            text-sm
                            font-bold
                            ${
                              isCurrent
                                ? "bg-[#7A1F2B] text-white"
                                : "bg-gray-100 text-gray-700"
                            }
                          `}
                        >
                          {
                            question.number
                          }
                        </span>

                        {/* НАЗВА */}

                        <span
                          className={`
                            font-semibold
                            ${
                              isCurrent
                                ? "text-[#7A1F2B]"
                                : "text-gray-700"
                            }
                          `}
                        >
                          Питання №{" "}
                          {
                            question.number
                          }
                        </span>

                        {/* ПОТОЧНЕ */}

                        {isCurrent && (
                          <span className="
                            rounded-full
                            bg-[#7A1F2B]
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-white
                          ">
                            Поточне
                          </span>
                        )}
                      </div>

                      {/* СТАН ВІДПОВІДІ */}

                      {question.answered ? (
                        <span
                          className="
                            flex
                            items-center
                            gap-2
                            font-semibold
                            text-green-600
                          "
                        >
                          <span className="text-xl">
                            ✓
                          </span>

                          <span className="hidden sm:inline">
                            Відповідь
                            надано
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Не відповідав
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {/* =================================================
          ДОДАТКОВИЙ СТАН
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