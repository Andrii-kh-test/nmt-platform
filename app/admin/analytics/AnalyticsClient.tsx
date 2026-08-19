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
// СЛУЖБОВІ ФУНКЦІЇ
// =====================================================

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
      return "Встановлення відповідності";

    case "sequence":
      return "Встановлення послідовності";

    default:
      return type;
  }
}

// =====================================================
// ОЧИЩЕННЯ ТЕХНІЧНИХ ДАНИХ
// =====================================================

function cleanText(text: string): string {
  if (!text) {
    return "";
  }

  let result = text;

  // L|... та R|... — службові записи matching
  if (result.startsWith("L|")) {
    const parts = result.split("|");

    if (parts.length >= 3) {
      result = parts[2];
    }
  }

  if (result.startsWith("R|")) {
    const parts = result.split("|");

    if (parts.length >= 3) {
      result = parts[2];
    }
  }

  // Прибираємо можливі службові маркери на початку
  result = result.replace(
    /^(L|R)\|\d+\|/i,
    ""
  );

  // Якщо у текст потрапили JSON-обгортки,
  // намагаємося показати тільки текст
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
// ОЧИЩЕННЯ MATCHING
// =====================================================

function getMatchingParts(text: string) {
  const parts = text.split("|");

  if (parts[0] === "L") {
    return {
      side: "left",
      id: Number(parts[1]),
      text: parts[2] ?? text,
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
      text: parts[2] ?? text,
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
      setError(
        "Не вказано ID тесту."
      );

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
  // ВІДКРИТТЯ ПИТАННЯ
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
            Натисніть на питання, щоб
            переглянути повний текст
            завдання та відповіді.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px]">

              <thead className="bg-[#7A1F2B] text-white">

                <tr>

                  <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-semibold">
                    №
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold">
                    Питання
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-semibold">
                    Тип
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-semibold">
                    Правильно
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-semibold">
                    Неправильно
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-semibold">
                    Пропущено
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-semibold">
                    Складність
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-semibold">
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
                      <>

                        {/* =================================================
                            ОСНОВНИЙ РЯДОК
                        ================================================= */}

                        <tr
                          key={`row-${question.id}`}
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

                          <td className="px-4 py-4 text-center">

                            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3E8EA] font-bold text-[#7A1F2B]">
                              {
                                question.order
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4">

                            <div className="font-semibold text-gray-800">
                              Питання{" "}
                              {
                                question.order
                              }
                            </div>

                            <div className="mt-1 text-xs text-gray-400">
                              {
                                question.points
                              }{" "}
                              бал.
                            </div>

                          </td>

                          <td className="px-4 py-4 text-center text-sm text-gray-600">
                            {getQuestionTypeLabel(
                              question.type
                            )}
                          </td>

                          <td className="px-4 py-4 text-center">

                            <div className="font-bold text-green-600">
                              {
                                question.correctPercent
                              }%
                            </div>

                            <div className="text-xs text-gray-500">
                              {
                                question.correct
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4 text-center">

                            <div className="font-bold text-red-600">
                              {
                                question.incorrectPercent
                              }%
                            </div>

                            <div className="text-xs text-gray-500">
                              {
                                question.incorrect
                              }
                            </div>

                          </td>

                          <td className="px-4 py-4 text-center">

                            <div className="font-bold text-gray-500">
                              {
                                question.skippedPercent
                              }%
                            </div>

                            <div className="text-xs text-gray-500">
                              {
                                question.skipped
                              }
                            </div>

                          </td>

                          {/* =================================================
                              СКЛАДНІСТЬ
                          ================================================= */}

                          <td className="px-4 py-4 text-center">

                            {question.difficulty ? (
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDifficultyClasses(
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
                            ) : (
                              <span className="text-sm text-gray-400">
                                Не визначено
                              </span>
                            )}

                          </td>

                          <td className="px-4 py-4 text-center">

                            <span className="text-xl text-gray-400">
                              {isExpanded
                                ? "⌃"
                                : "⌄"}
                            </span>

                          </td>

                        </tr>

                        {/* =================================================
                            РОЗГОРНУТИЙ РЯДОК
                        ================================================= */}

                        {isExpanded && (
                          <tr
                            key={`details-${question.id}`}
                          >

                            <td
                              colSpan={8}
                              className="border-t border-gray-200 bg-gray-50 p-6"
                            >

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
                                        УМОВА
                                    ================================================= */}

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
                                            {
                                              details.points
                                            }{" "}
                                            бал.
                                          </span>

                                        </div>

                                      </div>

                                      <div className="mt-5 whitespace-pre-wrap text-base leading-7 text-gray-800">
                                        {cleanText(
                                          details.text
                                        )}
                                      </div>

                                    </div>

                                    {/* =================================================
                                        ВАРІАНТИ SINGLE / MULTIPLE
                                    ================================================= */}

                                    {details.type !==
                                      "matching" &&
                                      details.type !==
                                        "sequence" && (

                                        <div className="rounded-xl border border-gray-200 bg-white p-6">

                                          <h4 className="mb-4 text-lg font-bold text-gray-800">
                                            Варіанти відповідей
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

                                      )}

                                    {/* =================================================
                                        MATCHING
                                    ================================================= */}

                                    {details.type ===
                                      "matching" && (

                                      <div className="rounded-xl border border-gray-200 bg-white p-6">

                                        <h4 className="mb-4 text-lg font-bold text-gray-800">
                                          Встановлення відповідності
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
                                                    className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-2"
                                                  >

                                                    <div>

                                                      <p className="text-xs font-semibold uppercase text-gray-500">
                                                        Елемент
                                                      </p>

                                                      <p className="mt-1 text-gray-800">
                                                        {cleanText(
                                                          left.text
                                                        )}
                                                      </p>

                                                    </div>

                                                    <div>

                                                      <p className="text-xs font-semibold uppercase text-green-600">
                                                        Правильна відповідь
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
                                        СТАТИСТИКА ПИТАННЯ
                                    ================================================= */}

                                    <div className="grid gap-4 sm:grid-cols-3">

                                      <div className="rounded-xl bg-green-50 p-5">

                                        <p className="text-sm text-green-700">
                                          Правильно
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-green-700">
                                          {
                                            question.correct
                                          }{" "}
                                          (
                                          {
                                            question.correctPercent
                                          }%)
                                        </p>

                                      </div>

                                      <div className="rounded-xl bg-red-50 p-5">

                                        <p className="text-sm text-red-700">
                                          Неправильно
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-red-700">
                                          {
                                            question.incorrect
                                          }{" "}
                                          (
                                          {
                                            question.incorrectPercent
                                          }%)
                                        </p>

                                      </div>

                                      <div className="rounded-xl bg-gray-100 p-5">

                                        <p className="text-sm text-gray-600">
                                          Пропущено
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-gray-700">
                                          {
                                            question.skipped
                                          }{" "}
                                          (
                                          {
                                            question.skippedPercent
                                          }%)
                                        </p>

                                      </div>

                                    </div>

                                  </div>
                                )}

                            </td>

                          </tr>
                        )}

                      </>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        </div>

      </section>

      {/* =================================================
          ШКАЛА ВИЗНАЧЕННЯ СКЛАДНОСТІ
      ================================================= */}

      <section>

        <div className="mb-5">

          <h3 className="text-2xl font-bold text-gray-800">
            Шкала визначення складності
          </h3>

          <p className="mt-1 text-gray-500">
            Рівень складності визначається за часткою
            учасників, які правильно виконали завдання.
          </p>

        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            {/* ЛЕГКЕ */}

            <div className="rounded-xl bg-green-50 p-5">

              <div className="flex items-center gap-3">

                <span className="h-4 w-4 rounded-full bg-green-500" />

                <span className="font-bold text-green-700">
                  Легке
                </span>

              </div>

              <p className="mt-3 text-sm text-green-700">
                80–100% правильних відповідей
              </p>

            </div>

            {/* СЕРЕДНЬОЇ СКЛАДНОСТІ */}

            <div className="rounded-xl bg-yellow-50 p-5">

              <div className="flex items-center gap-3">

                <span className="h-4 w-4 rounded-full bg-yellow-500" />

                <span className="font-bold text-yellow-700">
                  Середньої складності
                </span>

              </div>

              <p className="mt-3 text-sm text-yellow-700">
                60–79% правильних відповідей
              </p>

            </div>

            {/* СКЛАДНЕ */}

            <div className="rounded-xl bg-orange-50 p-5">

              <div className="flex items-center gap-3">

                <span className="h-4 w-4 rounded-full bg-orange-500" />

                <span className="font-bold text-orange-700">
                  Складне
                </span>

              </div>

              <p className="mt-3 text-sm text-orange-700">
                40–59% правильних відповідей
              </p>

            </div>

            {/* ДУЖЕ СКЛАДНЕ */}

            <div className="rounded-xl bg-red-50 p-5">

              <div className="flex items-center gap-3">

                <span className="h-4 w-4 rounded-full bg-red-500" />

                <span className="font-bold text-red-700">
                  Дуже складне
                </span>

              </div>

              <p className="mt-3 text-sm text-red-700">
                0–39% правильних відповідей
              </p>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}