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

  participants: {
    id: number;
    name: string;
    earnedPoints: number;
    percent: number;
  }[];

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
// КОЛІР СКЛАДНОСТІ
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
// ВИЗНАЧЕННЯ СКЛАДНОСТІ
//
// 0–20   Дуже складне
// 20–40  Складне
// 40–60  Оптимальне
// 60–80  Легке
// 80–100 Дуже легке
// =====================================================

function getDifficultyByPercent(percent: number) {
  if (percent < 20) {
    return {
      label: "Дуже складне",
      color: "red",
    };
  }

  if (percent < 40) {
    return {
      label: "Складне",
      color: "orange",
    };
  }

  if (percent < 60) {
    return {
      label: "Оптимальне",
      color: "yellow",
    };
  }

  if (percent < 80) {
    return {
      label: "Легке",
      color: "green",
    };
  }

  return {
    label: "Дуже легке",
    color: "emerald",
  };
}

function getDifficultyBadgeClasses(
  color: string
) {
  switch (color) {
    case "red":
      return "border-red-200 bg-red-50 text-red-700";

    case "orange":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "yellow":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";

    case "green":
      return "border-green-200 bg-green-50 text-green-700";

    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
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

  result = result.replace(
    /^(L|R)\|\d+\|/i,
    ""
  );

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
// COMPONENT
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
            переглянути його в режимі,
            наближеному до інтерфейсу учасника.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="bg-[#7A1F2B] text-white">

                <tr>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    №
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-semibold">
                    Питання
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    Тип
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    Правильно
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    Неправильно
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    Пропущено
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    Складність
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
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

                    const calculatedDifficulty =
                      getDifficultyByPercent(
                        question.correctPercent
                      );

                    return (
                      <tbody
                        key={question.id}
                      >
                        <tr
                          onClick={() =>
                            toggleQuestion(
                              question.id
                            )
                          }
                          className={`cursor-pointer transition ${
                            isExpanded
                              ? "bg-[#FCF8F9]"
                              : "hover:bg-gray-50"
                          }`}
                        >

                          <td className="px-5 py-5 text-center">

                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E8EA] font-bold text-[#7A1F2B]">
                              {question.order}
                            </div>

                          </td>

                          <td className="px-5 py-5">

                            <div className="font-semibold text-gray-800">
                              Питання №{" "}
                              {question.order}
                            </div>

                            <div className="mt-1 text-xs text-gray-400">
                              ID:{" "}
                              {question.id}
                              {" · "}
                              {question.points} бал.
                            </div>

                          </td>

                          <td className="px-5 py-5 text-center text-sm text-gray-600">
                            {getQuestionTypeLabel(
                              question.type
                            )}
                          </td>

                          <td className="px-5 py-5 text-center">

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

                          <td className="px-5 py-5 text-center">

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

                          <td className="px-5 py-5 text-center">

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

                          <td className="px-5 py-5 text-center">

                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getDifficultyBadgeClasses(
                                calculatedDifficulty.color
                              )}`}
                            >
                              {
                                calculatedDifficulty.label
                              }
                            </span>

                          </td>

                          <td className="px-5 py-5 text-center">

                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition">
                              {isExpanded
                                ? "⌃"
                                : "⌄"}
                            </span>

                          </td>

                        </tr>

                        {/* =================================================
                            РОЗГОРНУТЕ ПИТАННЯ
                        ================================================= */}

                        {isExpanded && (

                          <tr>

                            <td
                              colSpan={8}
                              className="bg-[#F7F8FA] px-5 py-7"
                            >

                              {isLoading && (

                                <div className="flex items-center justify-center py-12">

                                  <div className="text-center">

                                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

                                    <p className="mt-4 text-gray-500">
                                      Завантаження завдання...
                                    </p>

                                  </div>

                                </div>

                              )}

                              {!isLoading &&
                                details && (

                                <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-lg">

                                  {/* =================================================
                                      HEADER КАРТКИ
                                  ================================================= */}

                                  <div className="border-b border-gray-200 bg-white px-7 py-6">

                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                      <div>

                                        <div className="flex items-center gap-3">

                                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7A1F2B] text-lg font-bold text-white">
                                            {
                                              details.order
                                            }
                                          </div>

                                          <div>

                                            <h4 className="text-xl font-bold text-gray-800">
                                              Питання №{" "}
                                              {
                                                details.order
                                              }
                                            </h4>

                                            <p className="mt-1 text-sm text-gray-500">
                                              Перегляд завдання
                                            </p>

                                          </div>

                                        </div>

                                      </div>

                                      <div className="flex flex-wrap gap-2">

                                        <span className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
                                          {getQuestionTypeLabel(
                                            details.type
                                          )}
                                        </span>

                                        <span className="rounded-full border border-[#E7C7CD] bg-[#F9EFF1] px-4 py-2 text-sm font-bold text-[#7A1F2B]">
                                          {
                                            details.points
                                          }{" "}
                                          бал.
                                        </span>

                                      </div>

                                    </div>

                                  </div>

                                  {/* =================================================
                                      CONTENT
                                  ================================================= */}

                                  <div className="space-y-6 p-7">

                                    {/* УМОВА */}

                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">

                                      <div className="mb-4 flex items-center gap-3">

                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
                                          <span className="font-bold text-[#7A1F2B]">
                                            ?
                                          </span>
                                        </div>

                                        <h5 className="text-lg font-bold text-gray-800">
                                          Умова завдання
                                        </h5>

                                      </div>

                                      <div className="rounded-lg border border-gray-200 bg-white p-5">

                                        <div className="whitespace-pre-wrap text-base leading-7 text-gray-800">
                                          {cleanText(
                                            details.text
                                          )}
                                        </div>

                                      </div>

                                    </div>

                                    {/* SINGLE / MULTIPLE */}

                                    {(details.type ===
                                      "single" ||
                                      details.type ===
                                        "multiple") && (

                                      <div className="rounded-xl border border-gray-200 bg-white p-6">

                                        <div className="mb-5 flex items-center justify-between">

                                          <h5 className="text-lg font-bold text-gray-800">
                                            Варіанти відповідей
                                          </h5>

                                          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Еталонна відповідь
                                          </span>

                                        </div>

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
                                              ) => {

                                                const isCorrect =
                                                  option.isCorrect;

                                                return (

                                                  <div
                                                    key={
                                                      option.id
                                                    }
                                                    className={`flex items-start gap-4 rounded-xl border-2 p-4 transition ${
                                                      isCorrect
                                                        ? "border-green-400 bg-green-50"
                                                        : "border-gray-200 bg-white"
                                                    }`}
                                                  >

                                                    <div
                                                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold ${
                                                        isCorrect
                                                          ? "bg-green-600 text-white"
                                                          : "bg-gray-100 text-gray-600"
                                                      }`}
                                                    >
                                                      {String.fromCharCode(
                                                        65 +
                                                          index
                                                      )}
                                                    </div>

                                                    <div className="flex flex-1 items-start gap-4">

                                                      <div
                                                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                                          details.type ===
                                                          "single"
                                                            ? "rounded-full"
                                                            : "rounded-md"
                                                        } ${
                                                          isCorrect
                                                            ? "border-green-600 bg-green-600"
                                                            : "border-gray-300 bg-white"
                                                        }`}
                                                      >

                                                        {isCorrect && (
                                                          <span className="text-xs font-bold text-white">
                                                            ✓
                                                          </span>
                                                        )}

                                                      </div>

                                                      <div className="flex-1">

                                                        <p className="whitespace-pre-wrap text-base leading-6 text-gray-800">
                                                          {cleanText(
                                                            option.text
                                                          )}
                                                        </p>

                                                        {isCorrect && (

                                                          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">

                                                            <span>
                                                              ✓
                                                            </span>

                                                            Правильна відповідь

                                                          </div>

                                                        )}

                                                      </div>

                                                    </div>

                                                  </div>

                                                );
                                              }
                                            )}

                                        </div>

                                      </div>

                                    )}

                                    {/* MATCHING */}

                                    {details.type ===
                                      "matching" && (

                                      <div className="rounded-xl border border-gray-200 bg-white p-6">

                                        <h5 className="mb-5 text-lg font-bold text-gray-800">
                                          Встановлення відповідності
                                        </h5>

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
                                                    className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_auto_1fr] md:items-center"
                                                  >

                                                    <div className="rounded-lg border border-gray-200 bg-white p-4">

                                                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                                                        Елемент
                                                      </p>

                                                      <p className="text-gray-800">
                                                        {cleanText(
                                                          left.text
                                                        )}
                                                      </p>

                                                    </div>

                                                    <div className="hidden text-xl font-bold text-[#7A1F2B] md:block">
                                                      →
                                                    </div>

                                                    <div className="rounded-lg border border-green-300 bg-green-50 p-4">

                                                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-green-600">
                                                        Правильна відповідь
                                                      </p>

                                                      <p className="text-gray-800">
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

                                    {/* SEQUENCE */}

                                    {details.type ===
                                      "sequence" && (

                                      <div className="rounded-xl border border-gray-200 bg-white p-6">

                                        <h5 className="mb-5 text-lg font-bold text-gray-800">
                                          Правильна послідовність
                                        </h5>

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
                                            .sort(
                                              (
                                                a,
                                                b
                                              ) =>
                                                a.order -
                                                b.order
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
                                                  className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-4"
                                                >

                                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 font-bold text-white">
                                                    {index +
                                                      1}
                                                  </div>

                                                  <div className="text-gray-800">
                                                    {cleanText(
                                                      option.text
                                                    )}
                                                  </div>

                                                </div>

                                              )
                                            )}

                                        </div>

                                      </div>

                                    )}

                                    {/* =================================================
                                        QUESTION STATISTICS
                                    ================================================= */}

                                    <div>

                                      <div className="mb-4 flex items-center justify-between">

                                        <h5 className="text-lg font-bold text-gray-800">
                                          Статистика завдання
                                        </h5>

                                        <span
                                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getDifficultyBadgeClasses(
                                            calculatedDifficulty.color
                                          )}`}
                                        >
                                          {
                                            calculatedDifficulty.label
                                          }
                                        </span>

                                      </div>

                                      <div className="grid gap-4 md:grid-cols-3">

                                        <div className="rounded-xl border border-green-200 bg-green-50 p-5">

                                          <p className="text-sm font-medium text-green-700">
                                            Правильно
                                          </p>

                                          <p className="mt-2 text-3xl font-bold text-green-700">
                                            {
                                              question.correctPercent
                                            }%
                                          </p>

                                          <p className="mt-1 text-sm text-green-700/70">
                                            {
                                              question.correct
                                            }{" "}
                                            учасників
                                          </p>

                                        </div>

                                        <div className="rounded-xl border border-red-200 bg-red-50 p-5">

                                          <p className="text-sm font-medium text-red-700">
                                            Неправильно
                                          </p>

                                          <p className="mt-2 text-3xl font-bold text-red-700">
                                            {
                                              question.incorrectPercent
                                            }%
                                          </p>

                                          <p className="mt-1 text-sm text-red-700/70">
                                            {
                                              question.incorrect
                                            }{" "}
                                            учасників
                                          </p>

                                        </div>

                                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                                          <p className="text-sm font-medium text-gray-600">
                                            Пропущено
                                          </p>

                                          <p className="mt-2 text-3xl font-bold text-gray-700">
                                            {
                                              question.skippedPercent
                                            }%
                                          </p>

                                          <p className="mt-1 text-sm text-gray-500">
                                            {
                                              question.skipped
                                            }{" "}
                                            учасників
                                          </p>

                                        </div>

                                      </div>

                                    </div>

                                  </div>

                                </div>

                              )}

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

      <section>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* HEADER */}

          <div className="border-b border-gray-200 bg-gradient-to-r from-[#7A1F2B] to-[#922B3A] px-7 py-6">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl text-white">
                ◈
              </div>

              <div>

                <h3 className="text-2xl font-bold text-white">
                  Шкала складності завдань
                </h3>

                <p className="mt-1 text-sm text-white/80">
                  Класифікація за часткою правильних відповідей
                </p>

              </div>

            </div>

          </div>

          {/* SCALE */}

          <div className="p-7">

            <div className="grid gap-3 lg:grid-cols-5">

              {/* 0–20 */}

              <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50">

                <div className="h-2 bg-red-500" />

                <div className="p-5">

                  <div className="flex items-center justify-between">

                    <span className="text-2xl font-bold text-red-700">
                      0–20%
                    </span>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                      1
                    </span>

                  </div>

                  <p className="mt-3 font-bold text-red-700">
                    Дуже складне
                  </p>

                  <p className="mt-1 text-sm leading-5 text-red-700/70">
                    Правильну відповідь обирає дуже мала частка учасників.
                  </p>

                </div>

              </div>

              {/* 20–40 */}

              <div className="overflow-hidden rounded-xl border border-orange-200 bg-orange-50">

                <div className="h-2 bg-orange-500" />

                <div className="p-5">

                  <div className="flex items-center justify-between">

                    <span className="text-2xl font-bold text-orange-700">
                      20–40%
                    </span>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      2
                    </span>

                  </div>

                  <p className="mt-3 font-bold text-orange-700">
                    Складне
                  </p>

                  <p className="mt-1 text-sm leading-5 text-orange-700/70">
                    Правильну відповідь обирає менше половини учасників.
                  </p>

                </div>

              </div>

              {/* 40–60 */}

              <div className="overflow-hidden rounded-xl border border-yellow-200 bg-yellow-50">

                <div className="h-2 bg-yellow-400" />

                <div className="p-5">

                  <div className="flex items-center justify-between">

                    <span className="text-2xl font-bold text-yellow-700">
                      40–60%
                    </span>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                      3
                    </span>

                  </div>

                  <p className="mt-3 font-bold text-yellow-700">
                    Оптимальне
                  </p>

                  <p className="mt-1 text-sm leading-5 text-yellow-700/70">
                    Завдання має збалансований рівень складності.
                  </p>

                </div>

              </div>

              {/* 60–80 */}

              <div className="overflow-hidden rounded-xl border border-green-200 bg-green-50">

                <div className="h-2 bg-green-500" />

                <div className="p-5">

                  <div className="flex items-center justify-between">

                    <span className="text-2xl font-bold text-green-700">
                      60–80%
                    </span>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
                      4
                    </span>

                  </div>

                  <p className="mt-3 font-bold text-green-700">
                    Легке
                  </p>

                  <p className="mt-1 text-sm leading-5 text-green-700/70">
                    Правильну відповідь обирає більшість учасників.
                  </p>

                </div>

              </div>

              {/* 80–100 */}

              <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">

                <div className="h-2 bg-emerald-500" />

                <div className="p-5">

                  <div className="flex items-center justify-between">

                    <span className="text-2xl font-bold text-emerald-700">
                      80–100%
                    </span>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      5
                    </span>

                  </div>

                  <p className="mt-3 font-bold text-emerald-700">
                    Дуже легке
                  </p>

                  <p className="mt-1 text-sm leading-5 text-emerald-700/70">
                    Правильну відповідь обирає переважна більшість учасників.
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                VISUAL SCALE
            ================================================= */}

            <div className="mt-8">

              <div className="mb-3 flex justify-between text-xs font-semibold text-gray-500">

                <span>
                  0%
                </span>

                <span>
                  20%
                </span>

                <span>
                  40%
                </span>

                <span>
                  60%
                </span>

                <span>
                  80%
                </span>

                <span>
                  100%
                </span>

              </div>

              <div className="flex h-5 overflow-hidden rounded-full shadow-inner">

                <div className="flex-1 bg-red-500" />

                <div className="flex-1 bg-orange-500" />

                <div className="flex-1 bg-yellow-400" />

                <div className="flex-1 bg-green-500" />

                <div className="flex-1 bg-emerald-500" />

              </div>

              <p className="mt-4 text-center text-sm text-gray-500">
                Чим менша частка правильних відповідей, тим вищою є складність завдання.
              </p>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}