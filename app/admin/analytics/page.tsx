"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type QuestionStatistic = {
  id: number;
  order: number;
  type: string;
  text: string;
  points: number;

  correct: number;
  incorrect: number;
  skipped: number;

  correctPercent: number;
  incorrectPercent: number;
  skippedPercent: number;

  difficulty: {
    label: string;
    color: string;
  };
};

type Participant = {
  id: number;
  name: string;
  earnedPoints: number;
  percent: number;
};

type AnalyticsData = {
  test: {
    id: number;
    title: string;
    subject: string | null;
    maxPoints: number;
    questionCount: number;
  };

  summary: {
    participants: number;
    maxScore: number;
    minScore: number;
    averageScore: number;
    averagePercent: number;
  };

  participants: Participant[];

  questions: QuestionStatistic[];
};

type QuestionDetails = {
  id: number;
  order: number;
  type: string;
  text: string;
  points: number;

  options: Array<{
    id: number;
    order: number;
    text: string;
    isCorrect: boolean;
  }>;
};

function getDifficultyClasses(color: string) {
  switch (color) {
    case "green":
      return "bg-green-100 text-green-700";

    case "yellow":
      return "bg-yellow-100 text-yellow-700";

    case "orange":
      return "bg-orange-100 text-orange-700";

    case "red":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getQuestionTypeLabel(type: string) {
  switch (type) {
    case "single":
      return "Одна правильна відповідь";

    case "multiple":
      return "Кілька правильних відповідей";

    case "matching":
      return "На встановлення відповідності";

    case "sequence":
      return "На встановлення послідовності";

    default:
      return type;
  }
}

function cleanMatchingText(text: string) {
  if (!text) {
    return "";
  }

  if (
    text.startsWith("L|") ||
    text.startsWith("R|")
  ) {
    const parts = text.split("|");

    return parts[2] ?? text;
  }

  return text;
}

/*
=====================================================
ОСНОВНИЙ КОМПОНЕНТ
=====================================================
*/

function AnalyticsContent() {
  const searchParams = useSearchParams();

  const testId = searchParams.get("testId");

  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [expandedQuestion, setExpandedQuestion] =
    useState<number | null>(null);

  const [questionDetails, setQuestionDetails] =
    useState<Record<number, QuestionDetails>>({});

  const [loadingQuestion, setLoadingQuestion] =
    useState<number | null>(null);

  /*
  ===================================================
  ЗАВАНТАЖЕННЯ ОСНОВНОЇ АНАЛІТИКИ
  ===================================================
  */

  useEffect(() => {
    if (!testId) {
  setError("Не вказано ID тесту.");
  setLoading(false);

  return;
}

const currentTestId = testId;

let cancelled = false;

async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
  `/api/analytics?testId=${encodeURIComponent(
    currentTestId
  )}`,
  {
    cache: "no-store",
  }
);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Не вдалося завантажити аналітику."
          );
        }

        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Не вдалося завантажити аналітику."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [testId]);

  /*
  ===================================================
  РОЗГОРТАННЯ КОНКРЕТНОГО ПИТАННЯ
  ===================================================
  */

  async function toggleQuestion(
    questionId: number
  ) {
    if (
      expandedQuestion === questionId
    ) {
      setExpandedQuestion(null);

      return;
    }

    setExpandedQuestion(questionId);

    /*
    Якщо питання вже завантажувалося,
    повторний запит не робимо.
    */

    if (questionDetails[questionId]) {
      return;
    }

    if (!testId) {
      return;
    }

    try {
      setLoadingQuestion(questionId);

      const response = await fetch(
        `/api/analytics/question?testId=${encodeURIComponent(
          testId
        )}&questionId=${encodeURIComponent(
          questionId
        )}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Не вдалося завантажити питання."
        );
      }

      setQuestionDetails((previous) => ({
        ...previous,
        [questionId]: data.question,
      }));
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося завантажити питання."
      );
    } finally {
      setLoadingQuestion(null);
    }
  }

  /*
  ===================================================
  LOADING
  ===================================================
  */

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

          <p className="mt-5 text-lg text-gray-600">
            Завантаження аналітики...
          </p>
        </div>
      </div>
    );
  }

  /*
  ===================================================
  ERROR
  ===================================================
  */

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Link
            href="/admin"
            className="rounded-lg bg-[#7A1F2B] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#641923]"
          >
            ← Повернутися до адміністративної панелі
          </Link>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <h2 className="text-xl font-bold text-red-700">
            Не вдалося завантажити аналітику
          </h2>

          <p className="mt-2 text-red-600">
            {error || "Невідома помилка."}
          </p>
        </div>
      </div>
    );
  }

  /*
  ===================================================
  PAGE
  ===================================================
  */

  return (
    <div className="space-y-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-4xl font-bold text-[#7A1F2B]">
            Аналітика
          </h2>

          <p className="mt-2 text-lg text-gray-600">
            {analytics.test.title}
          </p>

          {analytics.test.subject && (
            <p className="mt-1 text-gray-500">
              Предмет:{" "}
              {analytics.test.subject}
            </p>
          )}
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg bg-[#7A1F2B] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#641923]"
        >
          ← Повернутися до адміністративної панелі
        </Link>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Учасників
          </p>

          <p className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {analytics.summary.participants}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Максимальний результат
          </p>

          <p className="mt-2 text-3xl font-bold text-green-700">
            {analytics.summary.maxScore}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            балів
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Мінімальний результат
          </p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {analytics.summary.minScore}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            балів
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Середній результат
          </p>

          <p className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {analytics.summary.averageScore}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            балів
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Середній відсоток
          </p>

          <p className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {analytics.summary.averagePercent}%
          </p>
        </div>
      </div>

      {/* =================================================
          QUESTIONS
      ================================================= */}

      <section>
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-gray-800">
            Аналіз завдань
          </h3>

          <p className="mt-1 text-gray-500">
            Натисніть на завдання, щоб переглянути
            його повний текст та варіанти відповідей.
          </p>
        </div>

        <div className="space-y-4">
          {analytics.questions.map(
            (question) => {
              const details =
                questionDetails[question.id];

              const isExpanded =
                expandedQuestion === question.id;

              const isLoading =
                loadingQuestion === question.id;

              return (
                <div
                  key={question.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* QUESTION HEADER */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleQuestion(question.id)
                    }
                    className="w-full px-6 py-5 text-left transition hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F3E8EA] font-bold text-[#7A1F2B]">
                          {question.order}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-bold text-gray-800">
                              Завдання{" "}
                              {question.order}
                            </span>

                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                              ID: {question.id}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyClasses(
                                question.difficulty.color
                              )}`}
                            >
                              {
                                question.difficulty
                                  .label
                              }
                            </span>
                          </div>

                          <p className="mt-2 line-clamp-2 text-gray-600">
                            {question.text}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">
                            Правильно
                          </p>

                          <p className="text-xl font-bold text-green-600">
                            {
                              question.correctPercent
                            }
                            %
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-gray-500">
                            Неправильно
                          </p>

                          <p className="text-xl font-bold text-red-600">
                            {
                              question.incorrectPercent
                            }
                            %
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-gray-500">
                            Пропущено
                          </p>

                          <p className="text-xl font-bold text-gray-500">
                            {
                              question.skippedPercent
                            }
                            %
                          </p>
                        </div>

                        <div className="text-2xl text-gray-400">
                          {isExpanded ? "⌃" : "⌄"}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* DETAILS */}

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-6">
                      {isLoading && (
                        <div className="flex items-center justify-center py-10">
                          <div className="text-center">
                            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

                            <p className="mt-3 text-gray-500">
                              Завантаження завдання...
                            </p>
                          </div>
                        </div>
                      )}

                      {!isLoading && details && (
                        <div className="space-y-6">
                          {/* УМОВА */}

                          <div className="rounded-xl border border-gray-200 bg-white p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h4 className="text-lg font-bold text-[#7A1F2B]">
                                Умова завдання
                              </h4>

                              <div className="flex gap-2">
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                                  {getQuestionTypeLabel(
                                    details.type
                                  )}
                                </span>

                                <span className="rounded-full bg-[#F3E8EA] px-3 py-1 text-sm font-semibold text-[#7A1F2B]">
                                  {details.points} бал.
                                </span>
                              </div>
                            </div>

                            <div className="mt-5 whitespace-pre-wrap text-base leading-7 text-gray-800">
                              {details.text}
                            </div>
                          </div>

                          {/* ВАРІАНТИ */}

                          <div>
                            <h4 className="mb-4 text-lg font-bold text-gray-800">
                              Варіанти відповідей
                            </h4>

                            <div className="space-y-3">
                              {details.options
                                .filter(
                                  (option) =>
                                    !option.text.startsWith(
                                      "L|"
                                    ) &&
                                    !option.text.startsWith(
                                      "R|"
                                    )
                                )
                                .map(
                                  (
                                    option,
                                    index
                                  ) => (
                                    <div
                                      key={
                                        option.id
                                      }
                                      className={`rounded-xl border p-4 ${
                                        option.isCorrect
                                          ? "border-green-300 bg-green-50"
                                          : "border-gray-200 bg-white"
                                      }`}
                                    >
                                      <div className="flex items-start gap-4">
                                        <div
                                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold ${
                                            option.isCorrect
                                              ? "bg-green-600 text-white"
                                              : "bg-gray-100 text-gray-600"
                                          }`}
                                        >
                                          {String.fromCharCode(
                                            65 + index
                                          )}
                                        </div>

                                        <div className="flex-1">
                                          <p className="text-gray-800">
                                            {option.text}
                                          </p>

                                          {option.isCorrect && (
                                            <p className="mt-2 text-sm font-semibold text-green-700">
                                              ✓ Правильна відповідь
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                            </div>
                          </div>

                          {/* MATCHING */}

                          {details.type ===
                            "matching" && (
                            <div className="rounded-xl border border-gray-200 bg-white p-6">
                              <h4 className="mb-4 text-lg font-bold text-gray-800">
                                Відповідність
                              </h4>

                              <div className="grid gap-3">
                                {details.options
                                  .filter(
                                    (option) =>
                                      option.text.startsWith(
                                        "L|"
                                      )
                                  )
                                  .map(
                                    (option) => {
                                      const parts =
                                        option.text.split(
                                          "|"
                                        );

                                      const leftText =
                                        cleanMatchingText(
                                          option.text
                                        );

                                      const correctRightId =
                                        Number(
                                          parts[3]
                                        );

                                      const rightOption =
                                        details.options.find(
                                          (
                                            candidate
                                          ) => {
                                            if (
                                              !candidate.text.startsWith(
                                                "R|"
                                              )
                                            ) {
                                              return false;
                                            }

                                            const rightParts =
                                              candidate.text.split(
                                                "|"
                                              );

                                            return (
                                              Number(
                                                rightParts[1]
                                              ) ===
                                              correctRightId
                                            );
                                          }
                                        );

                                      return (
                                        <div
                                          key={
                                            option.id
                                          }
                                          className="grid gap-2 rounded-lg border border-gray-200 p-4 md:grid-cols-2"
                                        >
                                          <div>
                                            <p className="text-xs font-semibold uppercase text-gray-500">
                                              Елемент
                                            </p>

                                            <p className="mt-1 text-gray-800">
                                              {
                                                leftText
                                              }
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs font-semibold uppercase text-green-600">
                                              Правильна відповідь
                                            </p>

                                            <p className="mt-1 text-gray-800">
                                              {rightOption
                                                ? cleanMatchingText(
                                                    rightOption.text
                                                  )
                                                : "Не визначено"}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                              </div>
                            </div>
                          )}

                          {/* СТАТИСТИКА */}

                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl bg-green-50 p-5">
                              <p className="text-sm text-green-700">
                                Правильно
                              </p>

                              <p className="mt-1 text-2xl font-bold text-green-700">
                                {question.correct} (
                                {
                                  question.correctPercent
                                }
                                %)
                              </p>
                            </div>

                            <div className="rounded-xl bg-red-50 p-5">
                              <p className="text-sm text-red-700">
                                Неправильно
                              </p>

                              <p className="mt-1 text-2xl font-bold text-red-700">
                                {question.incorrect} (
                                {
                                  question.incorrectPercent
                                }
                                %)
                              </p>
                            </div>

                            <div className="rounded-xl bg-gray-100 p-5">
                              <p className="text-sm text-gray-600">
                                Пропущено
                              </p>

                              <p className="mt-1 text-2xl font-bold text-gray-700">
                                {question.skipped} (
                                {
                                  question.skippedPercent
                                }
                                %)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* =================================================
          PARTICIPANTS
      ================================================= */}

      <section>
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-gray-800">
            Результати учасників
          </h3>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Учасник
                  </th>

                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                    Бал
                  </th>

                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                    Результат
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {analytics.participants.map(
                  (participant) => (
                    <tr
                      key={participant.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {participant.name}
                      </td>

                      <td className="px-6 py-4 text-center text-gray-700">
                        {participant.earnedPoints}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                            participant.percent >= 80
                              ? "bg-green-100 text-green-700"
                              : participant.percent >= 60
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {participant.percent}%
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

/*
=====================================================
PAGE + SUSPENSE
=====================================================

Next.js вимагає Suspense для useSearchParams()
під час production build.
*/

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

            <p className="mt-5 text-lg text-gray-600">
              Завантаження аналітики...
            </p>
          </div>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}