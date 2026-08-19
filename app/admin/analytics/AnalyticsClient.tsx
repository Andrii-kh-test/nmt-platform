"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  testId: string;
};

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

// =====================================================
// СКЛАДНІСТЬ
// =====================================================

function getDifficultyClasses(color: string) {
  switch (color) {
    case "green":
      return "bg-green-100 text-green-700 border-green-200";

    case "yellow":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";

    case "orange":
      return "bg-orange-100 text-orange-700 border-orange-200";

    case "red":
      return "bg-red-100 text-red-700 border-red-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

// =====================================================
// ТИП ЗАВДАННЯ
// =====================================================

function getQuestionTypeLabel(type: string) {
  switch (type) {
    case "single":
      return "Одна правильна відповідь";

    case "multiple":
      return "Кілька правильних відповідей";

    case "matching":
      return "Встановлення відповідності";

    case "sequence":
      return "Встановлення послідовності";

    default:
      return type;
  }
}

// =====================================================
// ОЧИЩЕННЯ ТЕХНІЧНИХ ЗАПИСІВ
// =====================================================

function cleanText(text: string): string {
  if (!text) {
    return "";
  }

  let result = text;

  // ===================================================
  // L|ID|TEXT|CORRECT_ID
  // R|ID|TEXT
  // ===================================================

  if (
    result.startsWith("L|") ||
    result.startsWith("R|")
  ) {
    const parts = result.split("|");

    if (parts.length >= 3) {
      result = parts
        .slice(2, parts[0] === "L" ? 3 : 3)
        .join("|");
    }
  }

  // ===================================================
  // ДОДАТКОВЕ ОЧИЩЕННЯ
  // ===================================================

  result = result.replace(
    /^(L|R)\|\d+\|/i,
    ""
  );

  // ===================================================
  // JSON-ОБГОРТКА
  // ===================================================

  try {
    const parsed = JSON.parse(result);

    if (typeof parsed === "string") {
      result = parsed;
    } else if (
      parsed &&
      typeof parsed === "object"
    ) {
      if (
        typeof parsed.text === "string"
      ) {
        result = parsed.text;
      } else if (
        typeof parsed.question === "string"
      ) {
        result = parsed.question;
      }
    }
  } catch {
    // Звичайний текст
  }

  return result
    .replace(/\r\n/g, "\n")
    .trim();
}

// =====================================================
// MATCHING
// =====================================================

function getMatchingParts(text: string) {
  const parts = text.split("|");

  if (parts[0] === "L") {
    return {
      side: "left",
      id: Number(parts[1]),
      text: parts[2] ?? "",
      correctId:
        parts[3] !== undefined
          ? Number(parts[3])
          : null,
    };
  }

  if (parts[0] === "R") {
    return {
      side: "right",
      id: Number(parts[1]),
      text: parts[2] ?? "",
      correctId: null,
    };
  }

  return {
    side: null,
    id: null,
    text,
    correctId: null,
  };
}

// =====================================================
// КОМПОНЕНТ
// =====================================================

export default function AnalyticsClient({
  testId,
}: Props) {
  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    expandedQuestion,
    setExpandedQuestion,
  ] = useState<number | null>(null);

  const [
    questionDetails,
    setQuestionDetails,
  ] = useState<
    Record<number, QuestionDetails>
  >({});

  const [
    loadingQuestion,
    setLoadingQuestion,
  ] = useState<number | null>(null);

  // =====================================================
  // ЗАВАНТАЖЕННЯ АНАЛІТИКИ
  // =====================================================

  useEffect(() => {
    if (!testId) {
      setError("Не вказано ID тесту.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/analytics?testId=${encodeURIComponent(
            testId
          )}`,
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

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

  // =====================================================
  // РОЗГОРТАННЯ ЗАВДАННЯ
  // =====================================================

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

    if (questionDetails[questionId]) {
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

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Не вдалося завантажити питання."
        );
      }

      setQuestionDetails(
        (previous) => ({
          ...previous,
          [questionId]:
            data.question,
        })
      );
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

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

          <p className="mt-5 text-lg text-gray-600">
            Завантаження аналітики...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

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
            {error ||
              "Невідома помилка."}
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

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
          QUESTIONS TABLE
      ================================================= */}

      <section>
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-gray-800">
            Аналіз завдань
          </h3>

          <p className="mt-1 text-gray-500">
            Натисніть на завдання, щоб
            переглянути умову та відповіді.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[7%]" />
                <col className="w-[29%]" />
                <col className="w-[17%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[5%]" />
              </colgroup>

              <thead className="bg-[#7A1F2B] text-white">
                <tr>
                  <th className="px-3 py-4 text-center text-sm font-semibold">
                    №
                  </th>

                  <th className="px-3 py-4 text-left text-sm font-semibold">
                    Питання
                  </th>

                  <th className="px-3 py-4 text-center text-sm font-semibold">
                    Тип
                  </th>

                  <th className="px-3 py-4 text-center text-sm font-semibold">
                    Правильно
                  </th>

                  <th className="px-3 py-4 text-center text-sm font-semibold">
                    Неправильно
                  </th>

                  <th className="px-3 py-4 text-center text-sm font-semibold">
                    Пропущено
                  </th>

                  <th className="px-3 py-4 text-center text-sm font-semibold">
                    Складність
                  </th>

                  <th className="px-3 py-4 text-center text-sm font-semibold">
                    Дія
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {analytics.questions.map(
                  (question) => {
                    const details =
                      questionDetails[
                        question.id
                      ];

                    const isExpanded =
                      expandedQuestion ===
                      question.id;

                    const isLoading =
                      loadingQuestion ===
                      question.id;

                    return (
                      <tbody
                        key={`question-group-${question.id}`}
                      >
                        <tr
                          onClick={() =>
                            toggleQuestion(
                              question.id
                            )
                          }
                          className={`cursor-pointer transition hover:bg-gray-50 ${
                            isExpanded
                              ? "bg-gray-50"
                              : ""
                          }`}
                        >
                          {/* № */}

                          <td className="px-3 py-4 text-center align-middle">
                            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3E8EA] font-bold text-[#7A1F2B]">
                              {
                                question.order
                              }
                            </div>
                          </td>

                          {/* ПИТАННЯ */}

                          <td className="px-3 py-4 align-middle">
                            <div className="font-semibold text-gray-800">
                              Питання{" "}
                              {
                                question.order
                              }
                            </div>

                            <div className="mt-1 text-xs text-gray-400">
                              ID:{" "}
                              {
                                question.id
                              }{" "}
                              ·{" "}
                              {
                                question.points
                              }{" "}
                              бал.
                            </div>
                          </td>

                          {/* ТИП */}

                          <td className="px-3 py-4 text-center align-middle">
                            <span className="text-sm text-gray-600">
                              {getQuestionTypeLabel(
                                question.type
                              )}
                            </span>
                          </td>

                          {/* ПРАВИЛЬНО */}

                          <td className="px-3 py-4 text-center align-middle">
                            <div className="font-bold text-green-600">
                              {
                                question.correctPercent
                              }
                              %
                            </div>

                            <div className="text-xs text-gray-500">
                              {
                                question.correct
                              }
                            </div>
                          </td>

                          {/* НЕПРАВИЛЬНО */}

                          <td className="px-3 py-4 text-center align-middle">
                            <div className="font-bold text-red-600">
                              {
                                question.incorrectPercent
                              }
                              %
                            </div>

                            <div className="text-xs text-gray-500">
                              {
                                question.incorrect
                              }
                            </div>
                          </td>

                          {/* ПРОПУЩЕНО */}

                          <td className="px-3 py-4 text-center align-middle">
                            <div className="font-bold text-gray-500">
                              {
                                question.skippedPercent
                              }
                              %
                            </div>

                            <div className="text-xs text-gray-500">
                              {
                                question.skipped
                              }
                            </div>
                          </td>

                          {/* СКЛАДНІСТЬ */}

                          <td className="px-3 py-4 text-center align-middle">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${getDifficultyClasses(
                                question
                                  .difficulty
                                  .color
                              )}`}
                            >
                              {
                                question
                                  .difficulty
                                  .label
                              }
                            </span>
                          </td>

                          {/* ДІЯ */}

                          <td className="px-3 py-4 text-center align-middle">
                            <span className="text-xl text-gray-400">
                              {isExpanded
                                ? "⌃"
                                : "⌄"}
                            </span>
                          </td>
                        </tr>

                        {/* =================================================
                            РОЗГОРНУТЕ ЗАВДАННЯ
                        ================================================= */}

                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={8}
                              className="border-t border-gray-200 bg-gray-50 p-5"
                            >
                              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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

                                {!isLoading &&
                                  details && (
                                    <div className="space-y-6">
                                      {/* =================================================
                                          HEADER ЗАВДАННЯ
                                      ================================================= */}

                                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-5">
                                        <div>
                                          <p className="text-sm font-medium text-gray-500">
                                            Завдання{" "}
                                            {
                                              question.order
                                            }
                                          </p>

                                          <h4 className="mt-1 text-xl font-bold text-[#7A1F2B]">
                                            Умова
                                            завдання
                                          </h4>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                                            {getQuestionTypeLabel(
                                              details.type
                                            )}
                                          </span>

                                          <span className="rounded-full bg-[#F3E8EA] px-3 py-1.5 text-sm font-semibold text-[#7A1F2B]">
                                            {
                                              details.points
                                            }{" "}
                                            бал.
                                          </span>

                                          <span
                                            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${getDifficultyClasses(
                                              question
                                                .difficulty
                                                .color
                                            )}`}
                                          >
                                            {
                                              question
                                                .difficulty
                                                .label
                                            }
                                          </span>
                                        </div>
                                      </div>

                                      {/* =================================================
                                          УМОВА
                                      ================================================= */}

                                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                                        <div className="text-base leading-7 text-gray-800">
                                          {cleanText(
                                            details.text
                                          )}
                                        </div>
                                      </div>

                                      {/* =================================================
                                          SINGLE / MULTIPLE
                                      ================================================= */}

                                      {details.type !==
                                        "matching" &&
                                        details.type !==
                                          "sequence" && (
                                          <div className="rounded-xl border border-gray-200 bg-white p-6">
                                            <h4 className="mb-5 text-lg font-bold text-gray-800">
                                              Варіанти
                                              відповідей
                                            </h4>

                                            <div className="space-y-3">
                                              {details.options
                                                .filter(
                                                  (
                                                    option
                                                  ) =>
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
                                                      className={`rounded-xl border p-4 transition ${
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
                                                            65 +
                                                              index
                                                          )}
                                                        </div>

                                                        <div className="flex-1">
                                                          <p className="whitespace-pre-wrap text-gray-800">
                                                            {cleanText(
                                                              option.text
                                                            )}
                                                          </p>

                                                          {option.isCorrect && (
                                                            <p className="mt-2 text-sm font-semibold text-green-700">
                                                              ✓
                                                              Правильна
                                                              відповідь
                                                            </p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )
                                                )}
                                            </div>
                                          </div>
                                        )}

                                      {/* =================================================
                                          MATCHING
                                      ================================================= */}

                                      {details.type ===
                                        "matching" && (
                                        <div className="rounded-xl border border-gray-200 bg-white p-6">
                                          <h4 className="mb-5 text-lg font-bold text-gray-800">
                                            Встановлення
                                            відповідності
                                          </h4>

                                          <div className="space-y-3">
                                            {details.options
                                              .filter(
                                                (
                                                  option
                                                ) =>
                                                  option.text.startsWith(
                                                    "L|"
                                                  )
                                              )
                                              .map(
                                                (
                                                  leftOption
                                                ) => {
                                                  const left =
                                                    getMatchingParts(
                                                      leftOption.text
                                                    );

                                                  const rightOption =
                                                    details.options.find(
                                                      (
                                                        option
                                                      ) => {
                                                        if (
                                                          !option.text.startsWith(
                                                            "R|"
                                                          )
                                                        ) {
                                                          return false;
                                                        }

                                                        const right =
                                                          getMatchingParts(
                                                            option.text
                                                          );

                                                        return (
                                                          right.id ===
                                                          left.correctId
                                                        );
                                                      }
                                                    );

                                                  return (
                                                    <div
                                                      key={
                                                        leftOption.id
                                                      }
                                                      className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-2"
                                                    >
                                                      <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                          Елемент
                                                        </p>

                                                        <p className="mt-1 text-gray-800">
                                                          {cleanText(
                                                            left.text
                                                          )}
                                                        </p>
                                                      </div>

                                                      <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                                                          Правильна
                                                          відповідь
                                                        </p>

                                                        <p className="mt-1 text-gray-800">
                                                          {rightOption
                                                            ? cleanText(
                                                                getMatchingParts(
                                                                  rightOption.text
                                                                ).text
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

                                      {/* =================================================
                                          СТАТИСТИКА
                                      ================================================= */}

                                      <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                                          <p className="text-sm font-medium text-green-700">
                                            Правильно
                                          </p>

                                          <p className="mt-1 text-2xl font-bold text-green-700">
                                            {
                                              question.correct
                                            }{" "}
                                            (
                                            {
                                              question.correctPercent
                                            }
                                            %)
                                          </p>
                                        </div>

                                        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                                          <p className="text-sm font-medium text-red-700">
                                            Неправильно
                                          </p>

                                          <p className="mt-1 text-2xl font-bold text-red-700">
                                            {
                                              question.incorrect
                                            }{" "}
                                            (
                                            {
                                              question.incorrectPercent
                                            }
                                            %)
                                          </p>
                                        </div>

                                        <div className="rounded-xl border border-gray-200 bg-gray-100 p-5">
                                          <p className="text-sm font-medium text-gray-600">
                                            Пропущено
                                          </p>

                                          <p className="mt-1 text-2xl font-bold text-gray-700">
                                            {
                                              question.skipped
                                            }{" "}
                                            (
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
                            </td>
                          </tr>
                        )}
                      </tbody>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =================================================
          ШКАЛА СКЛАДНОСТІ
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gradient-to-r from-[#7A1F2B] to-[#922638] px-6 py-6 text-white">
          <h3 className="text-2xl font-bold">
            Шкала визначення складності завдань
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
            Категорія складності визначається
            за часткою учасників, які виконали
            завдання правильно.
          </p>
        </div>

        <div className="p-6">
          {/* Візуальна шкала */}

          <div className="mb-8">
            <div className="flex h-5 w-full overflow-hidden rounded-full shadow-inner">
              <div className="flex-1 bg-red-500" />
              <div className="flex-1 bg-orange-500" />
              <div className="flex-1 bg-yellow-400" />
              <div className="flex-1 bg-green-400" />
              <div className="flex-1 bg-green-600" />
            </div>

            <div className="mt-2 flex justify-between text-xs font-medium text-gray-500">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
              <span>60%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Категорії */}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {/* 0–20 */}

            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-red-500" />

                <span className="text-sm font-bold text-red-700">
                  0–20%
                </span>
              </div>

              <h4 className="mt-3 text-lg font-bold text-red-700">
                Дуже складне
              </h4>

              <p className="mt-2 text-sm leading-5 text-red-600">
                Правильно відповідає не більше
                п'ятої частини учасників.
              </p>
            </div>

            {/* 20–40 */}

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-orange-500" />

                <span className="text-sm font-bold text-orange-700">
                  20–40%
                </span>
              </div>

              <h4 className="mt-3 text-lg font-bold text-orange-700">
                Складне
              </h4>

              <p className="mt-2 text-sm leading-5 text-orange-600">
                Правильна відповідь у меншої
                частини учасників.
              </p>
            </div>

            {/* 40–60 */}

            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-yellow-400" />

                <span className="text-sm font-bold text-yellow-700">
                  40–60%
                </span>
              </div>

              <h4 className="mt-3 text-lg font-bold text-yellow-700">
                Оптимальне
              </h4>

              <p className="mt-2 text-sm leading-5 text-yellow-700">
                Завдання має збалансований
                рівень складності.
              </p>
            </div>

            {/* 60–80 */}

            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-green-400" />

                <span className="text-sm font-bold text-green-700">
                  60–80%
                </span>
              </div>

              <h4 className="mt-3 text-lg font-bold text-green-700">
                Легке
              </h4>

              <p className="mt-2 text-sm leading-5 text-green-600">
                Правильно відповідає більшість
                учасників.
              </p>
            </div>

            {/* 80–100 */}

            <div className="rounded-xl border border-green-300 bg-green-100 p-5">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-green-600" />

                <span className="text-sm font-bold text-green-800">
                  80–100%
                </span>
              </div>

              <h4 className="mt-3 text-lg font-bold text-green-800">
                Дуже легке
              </h4>

              <p className="mt-2 text-sm leading-5 text-green-700">
                Правильно відповідає переважна
                більшість учасників.
              </p>
            </div>
          </div>

          {/* Пояснення */}

          <div className="mt-6 rounded-xl border border-[#E8D4D8] bg-[#FBF5F6] p-5">
            <p className="text-sm leading-6 text-gray-600">
              <span className="font-semibold text-[#7A1F2B]">
                Як читати шкалу:
              </span>{" "}
              чим більша частка правильних
              відповідей, тим легшим вважається
              завдання. Саме показник
              <span className="font-semibold">
                {" "}
                частки правильних відповідей
              </span>{" "}
              використовується для визначення
              складності кожного завдання в
              аналітиці.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}