"use client";

import { useMemo, useState } from "react";

type Question = {
  id: number;
  order: number;
  text: string;
};

type Props = {
  questions: Question[];
  currentQuestion: number;
  savedAnswers: unknown;
};

function hasAnswer(
  savedAnswers: unknown,
  questionIndex: number
): boolean {
  if (
    !savedAnswers ||
    typeof savedAnswers !== "object" ||
    Array.isArray(savedAnswers)
  ) {
    return false;
  }

  const answers =
    savedAnswers as Record<
      string,
      unknown
    >;

  const value =
    answers[String(questionIndex)];

  if (value === undefined) {
    return false;
  }

  if (value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

export default function MonitoringQuestions({
  questions,
  currentQuestion,
  savedAnswers,
}: Props) {
  const [expanded, setExpanded] =
    useState(false);

  const answeredCount = useMemo(() => {
    return questions.filter(
      (_, index) =>
        hasAnswer(
          savedAnswers,
          index
        )
    ).length;
  }, [
    questions,
    savedAnswers,
  ]);

  const safeCurrentQuestion =
    Math.min(
      Math.max(
        0,
        currentQuestion
      ),
      Math.max(
        0,
        questions.length - 1
      )
    );

  const current =
    questions[
      safeCurrentQuestion
    ];

  return (
    <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
      {/* =================================================
          ЗАГОЛОВОК
      ================================================= */}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-[#7A1F2B]">
          Поточне питання
        </h2>

        <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
          Відповіді:{" "}
          <span className="text-[#7A1F2B]">
            {answeredCount}
          </span>
          {" / "}
          {questions.length}
        </div>
      </div>

      {/* =================================================
          ПОТОЧНЕ ПИТАННЯ
      ================================================= */}

      {current ? (
        <div className="mb-4 rounded-xl border-2 border-[#7A1F2B] bg-[#fff8f9] p-5">
          <div className="text-sm font-semibold text-[#7A1F2B]">
            Поточне питання
          </div>

          <div className="mt-1 text-2xl font-bold text-gray-800">
            Питання №{" "}
            {safeCurrentQuestion + 1}
          </div>

          <p className="mt-3 text-gray-700">
            {current.text}
          </p>

          {hasAnswer(
            savedAnswers,
            safeCurrentQuestion
          ) && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
              <span>✓</span>
              <span>
                На питання вже надано відповідь
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-5 text-gray-500">
          Питання не знайдено.
        </div>
      )}

      {/* =================================================
          КНОПКА РОЗГОРТАННЯ
      ================================================= */}

      <button
        type="button"
        onClick={() =>
          setExpanded(
            (value) => !value
          )
        }
        className="
          flex
          w-full
          items-center
          justify-between
          rounded-xl
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
          {expanded
            ? "Згорнути список питань"
            : "Переглянути всі питання"}
        </span>

        <span className="text-xl">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* =================================================
          СПИСОК ПИТАНЬ
      ================================================= */}

      {expanded && (
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
          {questions.length === 0 ? (
            <div className="p-5 text-center text-gray-500">
              У цьому тесті немає питань.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {questions.map(
                (
                  question,
                  index
                ) => {
                  const isCurrent =
                    index ===
                    safeCurrentQuestion;

                  const answered =
                    hasAnswer(
                      savedAnswers,
                      index
                    );

                  return (
                    <div
                      key={
                        question.id
                      }
                      className={`
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                        transition
                        ${
                          isCurrent
                            ? "bg-[#fff1f3]"
                            : "bg-white hover:bg-gray-50"
                        }
                      `}
                    >
                      {/* =================================
                          НОМЕР
                      ================================= */}

                      <div
                        className={`
                          flex
                          h-9
                          w-9
                          shrink-0
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
                        {index + 1}
                      </div>

                      {/* =================================
                          ТЕКСТ
                      ================================= */}

                      <div className="min-w-0 flex-1">
                        <div
                          className={`
                            font-semibold
                            ${
                              isCurrent
                                ? "text-[#7A1F2B]"
                                : "text-gray-800"
                            }
                          `}
                        >
                          Питання №{" "}
                          {index + 1}
                        </div>

                        <div className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {question.text}
                        </div>
                      </div>

                      {/* =================================
                          ВІДПОВІДЬ
                      ================================= */}

                      <div className="shrink-0">
                        {answered ? (
                          <span
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-green-100
                              text-lg
                              font-bold
                              text-green-700
                            "
                            title="На питання вже надано відповідь"
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-full
                              bg-gray-100
                              text-sm
                              text-gray-400
                            "
                            title="Відповіді ще немає"
                          >
                            —
                          </span>
                        )}
                      </div>

                      {/* =================================
                          ПОТОЧНЕ
                      ================================= */}

                      {isCurrent && (
                        <div className="hidden shrink-0 sm:block">
                          <span
                            className="
                              rounded-full
                              bg-[#7A1F2B]
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              text-white
                            "
                          >
                            Поточне
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}