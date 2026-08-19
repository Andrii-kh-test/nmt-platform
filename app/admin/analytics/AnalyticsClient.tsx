"use client";

import {
  Fragment,
  useEffect,
  useState,
} from "react";

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

  participants: Array<{
    id: number;
    name: string;
    earnedPoints: number;
    percent: number;
  }>;

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
// НОРМАЛІЗАЦІЯ НАЗВ СКЛАДНОСТІ
// =====================================================

function normalizeDifficultyLabel(
  label: string
): string {
  const normalized = label
    .trim()
    .toLowerCase();

  if (
    normalized.includes("дуже склад")
  ) {
    return "Дуже складне";
  }

  if (
    normalized === "складне" ||
    normalized === "складний" ||
    normalized === "складна"
  ) {
    return "Складне";
  }

  if (
    normalized.includes("оптим")
  ) {
    return "Оптимальне";
  }

  if (
    normalized === "легке" ||
    normalized === "легкий" ||
    normalized === "легка"
  ) {
    return "Легке";
  }

  if (
    normalized.includes("дуже лег")
  ) {
    return "Дуже легке";
  }

  return label;
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
// ОЧИЩЕННЯ ТЕХНІЧНИХ ДАНИХ
// =====================================================

function cleanText(text: string): string {
  if (!text) {
    return "";
  }

  let result = String(text);

  // ===================================================
  // MATCHING
  //
  // L|1|Текст|3
  // R|3|Текст
  //
  // Користувачеві показуємо тільки "Текст".
  // ===================================================

  if (result.startsWith("L|")) {
    const parts = result.split("|");

    if (parts.length >= 3) {
      result = parts[2];
    }
  } else if (result.startsWith("R|")) {
    const parts = result.split("|");

    if (parts.length >= 3) {
      result = parts[2];
    }
  }

  // ===================================================
  // ДОДАТКОВЕ ОЧИЩЕННЯ СЛУЖБОВОГО ПРЕФІКСА
  // ===================================================

  result = result.replace(
    /^(?:L|R)\|\d+\|/i,
    ""
  );

  // ===================================================
  // JSON-ОБГОРТКИ
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
      } else if (
        typeof parsed.content === "string"
      ) {
        result = parsed.content;
      }
    }
  } catch {
    // Звичайний текст.
  }

  // ===================================================
  // ФІНАЛЬНЕ ОЧИЩЕННЯ
  // ===================================================

  return result
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

// =====================================================
// РОЗБІР MATCHING
// =====================================================

function getMatchingParts(text: string) {
  const parts = text.split("|");

  if (parts[0] === "L") {
    return {
      side: "left" as const,
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
      side: "right" as const,
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
// ШКАЛА СКЛАДНОСТІ
// =====================================================

const difficultyScale = [
  {
    range: "0–20%",
    label: "Дуже складне",
    description:
      "Правильно виконано не більше п'ятої частини відповідей.",
    className:
      "border-red-200 bg-red-50 text-red-700",
    dotClass:
      "bg-red-500",
  },

  {
    range: "20–40%",
    label: "Складне",
    description:
      "Правильно виконано від п'ятої до двох п'ятих відповідей.",
    className:
      "border-orange-200 bg-orange-50 text-orange-700",
    dotClass:
      "bg-orange-500",
  },

  {
    range: "40–60%",
    label: "Оптимальне",
    description:
      "Завдання має середній рівень складності.",
    className:
      "border-yellow-200 bg-yellow-50 text-yellow-700",
    dotClass:
      "bg-yellow-500",
  },

  {
    range: "60–80%",
    label: "Легке",
    description:
      "Правильно виконано більшість відповідей.",
    className:
      "border-lime-200 bg-lime-50 text-lime-700",
    dotClass:
      "bg-lime-500",
  },

  {
    range: "80–100%",
    label: "Дуже легке",
    description:
      "Правильно виконано переважну більшість відповідей.",
    className:
      "border-green-200 bg-green-50 text-green-700",
    dotClass:
      "bg-green-500",
  },
];

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
            Натисніть на номер завдання,
            щоб переглянути умову та
            відповіді.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[8%]" />
                <col className="w-[20%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[17%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
              </colgroup>

              <thead className="bg-[#7A1F2B] text-white">
                <tr>
                  <th className="px-3 py-4 text-center text-sm font-semibold">
                    №
                  </th>

                  <th className="px-3 py-4 text-center text-sm font-semibold">
                    Тип завдання
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
                    Балів
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

                    const difficultyLabel =
                      normalizeDifficultyLabel(
                        question.difficulty
                          ?.label ?? ""
                      );

                    return (
                      <Fragment
                        key={question.id}
                      >
                        {/* =================================================
                            ОСНОВНИЙ РЯДОК
                        ================================================= */}

                        <tr
                          onClick={() =>
                            toggleQuestion(
                              question.id
                            )
                          }
                          className={`cursor-pointer transition ${
                            isExpanded
                              ? "bg-[#faf6f7]"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {/* № */}

                          <td className="px-3 py-4 text-center align-middle">
                            <div
                              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl font-bold transition ${
                                isExpanded
                                  ? "bg-[#7A1F2B] text-white shadow-md"
                                  : "bg-[#F3E8EA] text-[#7A1F2B]"
                              }`}
                            >
                              {
                                question.order
                              }
                            </div>
                          </td>

                          {/* ТИП */}

                          <td className="px-3 py-4 text-center align-middle">
                            <span className="block text-sm font-medium leading-5 text-gray-700">
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

                            <div className="mt-1 text-xs text-gray-500">
                              {
                                question.correct
                              }{" "}
                              учасн.
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

                            <div className="mt-1 text-xs text-gray-500">
                              {
                                question.incorrect
                              }{" "}
                              учасн.
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

                            <div className="mt-1 text-xs text-gray-500">
                              {
                                question.skipped
                              }{" "}
                              учасн.
                            </div>
                          </td>

                          {/* СКЛАДНІСТЬ */}

                          <td className="px-3 py-4 text-center align-middle">
                            <span
                              className={`inline-flex max-w-full items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold leading-4 whitespace-normal ${getDifficultyClasses(
                                question
                                  .difficulty
                                  ?.color ??
                                  ""
                              )}`}
                            >
                              {
                                difficultyLabel
                              }
                            </span>
                          </td>

                          {/* БАЛИ */}

                          <td className="px-3 py-4 text-center align-middle">
                            <span className="font-bold text-gray-700">
                              {
                                question.points
                              }
                            </span>
                          </td>

                          {/* ДІЯ */}

                          <td className="px-3 py-4 text-center align-middle">
                            <span
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                                isExpanded
                                  ? "bg-[#F3E8EA] text-[#7A1F2B]"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
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
                              className="border-t border-gray-200 bg-[#f8f9fa] p-4 sm:p-6"
                            >
                              {isLoading && (
                                <div className="flex items-center justify-center py-12">
                                  <div className="text-center">
                                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

                                    <p className="mt-4 text-gray-500">
                                      Завантаження
                                      завдання...
                                    </p>
                                  </div>
                                </div>
                              )}

                              {!isLoading &&
                                details && (
                                  <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                                    {/* =================================================
                                        ВЕРХНЯ ЧАСТИНА КАРТКИ
                                    ================================================= */}

                                    <div className="border-b border-gray-200 bg-gradient-to-r from-[#7A1F2B] to-[#8f2c3a] px-5 py-5 text-white sm:px-7">
                                      <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                          <p className="text-sm font-medium text-white/75">
                                            Завдання
                                          </p>

                                          <h4 className="mt-1 text-2xl font-bold">
                                            Питання{" "}
                                            {
                                              question.order
                                            }
                                          </h4>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                          <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
                                            {getQuestionTypeLabel(
                                              details.type
                                            )}
                                          </span>

                                          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[#7A1F2B]">
                                            {
                                              details.points
                                            }{" "}
                                            бал.
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* =================================================
                                        УМОВА
                                    ================================================= */}

                                    <div className="p-5 sm:p-7">
                                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
                                        <div className="mb-4 flex items-center gap-3">
                                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3E8EA] text-lg text-[#7A1F2B]">
                                            ?
                                          </div>

                                          <h5 className="text-lg font-bold text-gray-800">
                                            Умова
                                            завдання
                                          </h5>
                                        </div>

                                        <div className="whitespace-pre-wrap text-base leading-7 text-gray-800">
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
                                          <div className="mt-6">
                                            <div className="mb-4 flex items-center gap-3">
                                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3E8EA] text-lg text-[#7A1F2B]">
                                                ✓
                                              </div>

                                              <h5 className="text-lg font-bold text-gray-800">
                                                Варіанти
                                                відповідей
                                              </h5>
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
                                                  ) => (
                                                    <div
                                                      key={
                                                        option.id
                                                      }
                                                      className={`rounded-xl border-2 p-4 transition ${
                                                        option.isCorrect
                                                          ? "border-green-400 bg-green-50 shadow-sm"
                                                          : "border-gray-200 bg-white"
                                                      }`}
                                                    >
                                                      <div className="flex items-start gap-4">
                                                        <div
                                                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
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

                                                        <div className="min-w-0 flex-1">
                                                          <div className="whitespace-pre-wrap text-base leading-6 text-gray-800">
                                                            {cleanText(
                                                              option.text
                                                            )}
                                                          </div>

                                                          {option.isCorrect && (
                                                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-700">
                                                              <span>
                                                                ✓
                                                              </span>

                                                              <span>
                                                                Правильна
                                                                відповідь
                                                              </span>
                                                            </div>
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
                                        <div className="mt-6">
                                          <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3E8EA] text-lg text-[#7A1F2B]">
                                              ↔
                                            </div>

                                            <h5 className="text-lg font-bold text-gray-800">
                                              Встановлення
                                              відповідності
                                            </h5>
                                          </div>

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
                                                  leftOption,
                                                  index
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
                                                      className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                                                    >
                                                      <div className="grid md:grid-cols-[1fr_auto_1fr]">
                                                        <div className="p-4 sm:p-5">
                                                          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                                            Елемент{" "}
                                                            {index +
                                                              1}
                                                          </p>

                                                          <p className="mt-2 whitespace-pre-wrap leading-6 text-gray-800">
                                                            {cleanText(
                                                              left.text
                                                            )}
                                                          </p>
                                                        </div>

                                                        <div className="hidden items-center justify-center bg-gray-50 px-4 text-xl text-gray-400 md:flex">
                                                          →
                                                        </div>

                                                        <div className="border-t border-gray-200 bg-green-50/50 p-4 sm:p-5 md:border-l md:border-t-0">
                                                          <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                                                            Правильна
                                                            відповідь
                                                          </p>

                                                          <p className="mt-2 whitespace-pre-wrap leading-6 text-gray-800">
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
                                                    </div>
                                                  );
                                                }
                                              )}
                                          </div>
                                        </div>
                                      )}

                                      {/* =================================================
                                          SEQUENCE
                                      ================================================= */}

                                      {details.type ===
                                        "sequence" && (
                                        <div className="mt-6">
                                          <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3E8EA] text-lg text-[#7A1F2B]">
                                              ≡
                                            </div>

                                            <h5 className="text-lg font-bold text-gray-800">
                                              Встановлення
                                              послідовності
                                            </h5>
                                          </div>

                                          <div className="rounded-xl border border-gray-200 bg-white p-5">
                                            <div className="space-y-2">
                                              {details.options.map(
                                                (
                                                  option,
                                                  index
                                                ) => (
                                                  <div
                                                    key={
                                                      option.id
                                                    }
                                                    className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                                                  >
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3E8EA] text-sm font-bold text-[#7A1F2B]">
                                                      {index +
                                                        1}
                                                    </div>

                                                    <div className="pt-1 text-gray-800">
                                                      {cleanText(
                                                        option.text
                                                      )}
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* =================================================
                                          СТАТИСТИКА ЗАВДАННЯ
                                      ================================================= */}

                                      <div className="mt-7 border-t border-gray-200 pt-6">
                                        <h5 className="mb-4 text-lg font-bold text-gray-800">
                                          Статистика
                                          виконання
                                        </h5>

                                        <div className="grid gap-4 sm:grid-cols-3">
                                          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                                            <p className="text-sm font-medium text-green-700">
                                              Правильно
                                            </p>

                                            <p className="mt-1 text-2xl font-bold text-green-700">
                                              {
                                                question.correct
                                              }{" "}
                                              <span className="text-base font-medium">
                                                (
                                                {
                                                  question.correctPercent
                                                }
                                                %)
                                              </span>
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
                                              <span className="text-base font-medium">
                                                (
                                                {
                                                  question.incorrectPercent
                                                }
                                                %)
                                              </span>
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
                                              <span className="text-base font-medium">
                                                (
                                                {
                                                  question.skippedPercent
                                                }
                                                %)
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* =================================================
                                          СКЛАДНІСТЬ
                                      ================================================= */}

                                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
                                        <div>
                                          <p className="text-sm text-gray-500">
                                            Рівень
                                            складності
                                          </p>

                                          <p className="mt-1 font-semibold text-gray-800">
                                            Частка
                                            правильних
                                            відповідей:{" "}
                                            {
                                              question.correctPercent
                                            }
                                            %
                                          </p>
                                        </div>

                                        <span
                                          className={`rounded-full border px-4 py-2 text-sm font-bold ${getDifficultyClasses(
                                            question
                                              .difficulty
                                              ?.color ??
                                              ""
                                          )}`}
                                        >
                                          {
                                            difficultyLabel
                                          }
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
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

          <div className="border-b border-gray-200 bg-gradient-to-r from-[#7A1F2B] to-[#8f2c3a] px-6 py-6 text-white">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  Шкала визначення складності
                </h3>

                <p className="mt-1 text-sm text-white/75">
                  Класифікація завдань за
                  часткою правильних відповідей
                </p>
              </div>

              <div className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                0–100%
              </div>
            </div>
          </div>

          {/* SCALE */}

          <div className="p-5 sm:p-7">
            <div className="grid gap-4 md:grid-cols-5">
              {difficultyScale.map(
                (item) => (
                  <div
                    key={item.label}
                    className={`relative overflow-hidden rounded-2xl border p-5 ${item.className}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full ${item.dotClass}`}
                      />

                      <span className="text-sm font-bold">
                        {item.range}
                      </span>
                    </div>

                    <h4 className="mt-4 text-lg font-bold">
                      {item.label}
                    </h4>

                    <p className="mt-2 text-sm leading-5 opacity-80">
                      {item.description}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* CONTINUOUS BAR */}

            <div className="mt-7">
              <div className="mb-2 flex justify-between text-xs font-medium text-gray-500">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100%</span>
              </div>

              <div className="grid h-4 grid-cols-5 overflow-hidden rounded-full">
                <div className="bg-red-500" />
                <div className="bg-orange-500" />
                <div className="bg-yellow-400" />
                <div className="bg-lime-500" />
                <div className="bg-green-500" />
              </div>
            </div>

            {/* NOTE */}

            <div className="mt-6 rounded-xl border border-[#ead9dc] bg-[#faf6f7] p-4">
              <p className="text-sm leading-6 text-gray-600">
                <span className="font-semibold text-[#7A1F2B]">
                  Як читати шкалу:
                </span>{" "}
                що більша частка учасників
                правильно виконала завдання,
                то нижчою є його статистична
                складність.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}