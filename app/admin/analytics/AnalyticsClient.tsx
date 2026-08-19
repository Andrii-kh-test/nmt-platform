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

  difficulty: string;
  difficultyColor: string;
};

type Participant = {
  id: number;
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;

  earnedPoints: number;
  maxPoints: number;
  percent: number;

  correct: number;
  incorrect: number;
  skipped: number;

  createdAt: string;
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
// ТИП СКЛАДНОСТІ
// =====================================================

function getDifficultyClasses(
  color: string
) {
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
// ТИП ПИТАННЯ
// =====================================================

function getQuestionTypeLabel(
  type: string
) {
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
//
// Приклади:
//
// L|1|Текст
// L|1|Текст|25
// R|25|Відповідь
//
// Показуємо тільки людський текст.
// =====================================================

function cleanText(
  text: string | null | undefined
): string {
  if (!text) {
    return "";
  }

  let result = String(text);

  // ---------------------------------------------------
  // JSON-обгортка
  // ---------------------------------------------------

  try {
    const parsed = JSON.parse(result);

    if (typeof parsed === "string") {
      result = parsed;
    } else if (
      parsed &&
      typeof parsed === "object"
    ) {
      const object =
        parsed as Record<string, unknown>;

      if (
        typeof object.text === "string"
      ) {
        result = object.text;
      } else if (
        typeof object.question ===
        "string"
      ) {
        result = object.question;
      } else if (
        typeof object.content ===
        "string"
      ) {
        result = object.content;
      }
    }
  } catch {
    // Звичайний текст.
  }

  // ---------------------------------------------------
  // L|id|text|correctId
  // R|id|text
  // ---------------------------------------------------

  const technicalMatch =
    result.match(
      /^(L|R)\|[^|]*\|([\s\S]*?)(?:\|[^|]*)?$/
    );

  if (technicalMatch) {
    result = technicalMatch[2];
  }

  // ---------------------------------------------------
  // Додаткове очищення службових маркерів
  // ---------------------------------------------------

  result = result.replace(
    /^(L|R)\|[^|]*\|/i,
    ""
  );

  // ---------------------------------------------------
  // Якщо службові частини випадково залишилися
  // ---------------------------------------------------

  result = result.replace(
    /\|(?:\d+)\s*$/g,
    ""
  );

  // ---------------------------------------------------
  // Технічні Unicode / control characters
  // ---------------------------------------------------

  result = result.replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
    ""
  );

  // ---------------------------------------------------
  // Переноси
  // ---------------------------------------------------

  return result
    .replace(/\r\n/g, "\n")
    .trim();
}

// =====================================================
// ОЧИЩЕННЯ MATCHING
// =====================================================

function getMatchingParts(
  text: string
) {
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
// НАЗВА УЧАСНИКА
// =====================================================

function getParticipantName(
  participant: Participant
) {
  const parts = [
    participant.lastName,
    participant.firstName,
    participant.middleName,
  ].filter(Boolean);

  return (
    parts.join(" ") ||
    "Без зазначеного ПІБ"
  );
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
  // РОЗГОРТАННЯ ПИТАННЯ
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
            {
              analytics.summary
                .participants
            }
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Максимальний результат
          </p>

          <p className="mt-2 text-3xl font-bold text-green-700">
            {
              analytics.summary
                .maxScore
            }
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
            {
              analytics.summary
                .minScore
            }
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
            {
              analytics.summary
                .averageScore
            }
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
            {
              analytics.summary
                .averagePercent
            }
            %
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
            Натисніть на завдання, щоб
            переглянути умову та
            правильну відповідь.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] table-fixed">
  <colgroup>
    <col style={{ width: "70px" }} />
    <col style={{ width: "180px" }} />
    <col style={{ width: "210px" }} />
    <col style={{ width: "150px" }} />
    <col style={{ width: "150px" }} />
    <col style={{ width: "150px" }} />
    <col style={{ width: "180px" }} />
    <col style={{ width: "110px" }} />
  </colgroup>

  <thead className="bg-[#7A1F2B] text-white">
  <tr>
    <th className="px-4 py-4 text-center text-sm font-semibold">
      №
    </th>

    <th className="px-4 py-4 text-left text-sm font-semibold">
      Питання
    </th>

    <th className="px-4 py-4 text-center text-sm font-semibold">
      Тип
    </th>

    <th className="px-4 py-4 text-center text-sm font-semibold">
      Правильно
    </th>

    <th className="px-4 py-4 text-center text-sm font-semibold">
      Неправильно
    </th>

    <th className="px-4 py-4 text-center text-sm font-semibold">
      Пропущено
    </th>

    <th className="px-4 py-4 text-center text-sm font-semibold">
      Складність
    </th>

    <th className="px-4 py-4 text-center text-sm font-semibold">
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
                              ? "bg-gray-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {/* № */}

                          <td className="px-4 py-5 text-center align-middle">
                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3E8EA] font-bold text-[#7A1F2B]">
                              {
                                question.order
                              }
                            </div>
                          </td>

                          {/* TYPE */}

                          <td className="px-4 py-5 text-center align-middle">
                            <span className="text-sm leading-5 text-gray-600">
                              {getQuestionTypeLabel(
                                question.type
                              )}
                            </span>
                          </td>

                          {/* CORRECT */}

                          <td className="px-4 py-5 text-center align-middle">
                            <div className="font-bold text-green-600">
                              {
                                question.correctPercent
                              }
                              %
                            </div>

                            <div className="text-xs text-gray-500">
                              {
                                question.correct
                              }{" "}
                              уч.
                            </div>
                          </td>

                          {/* INCORRECT */}

                          <td className="px-4 py-5 text-center align-middle">
                            <div className="font-bold text-red-600">
                              {
                                question.incorrectPercent
                              }
                              %
                            </div>

                            <div className="text-xs text-gray-500">
                              {
                                question.incorrect
                              }{" "}
                              уч.
                            </div>
                          </td>

                          {/* SKIPPED */}

                          <td className="px-4 py-5 text-center align-middle">
                            <div className="font-bold text-gray-500">
                              {
                                question.skippedPercent
                              }
                              %
                            </div>

                            <div className="text-xs text-gray-500">
                              {
                                question.skipped
                              }{" "}
                              уч.
                            </div>
                          </td>

                          {/* DIFFICULTY */}

                          <td className="px-4 py-5 text-center align-middle">
                            <div className="flex flex-col items-center gap-2">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getDifficultyClasses(
                                  question.difficultyColor
                                )}`}
                              >
                                {
                                  question.difficulty
                                }
                              </span>

                              <span className="text-xs text-gray-400">
                                {
                                  question.correctPercent
                                }
                                % правильних
                              </span>

                              <span className="text-lg text-gray-400">
                                {isExpanded
                                  ? "⌃"
                                  : "⌄"}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* =================================================
                            РОЗГОРНУТЕ ПИТАННЯ
                        ================================================= */}

                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={6}
                              className="border-t border-gray-200 bg-gray-50 p-5"
                            >
                              {isLoading && (
                                <div className="flex items-center justify-center py-12">
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
                                  <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                                    {/* =====================================
                                        HEADER КАРТКИ
                                    ===================================== */}

                                    <div className="border-b border-gray-200 bg-gradient-to-r from-[#7A1F2B] to-[#922C3A] px-6 py-5 text-white">
                                      <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                          <p className="text-sm font-medium text-white/70">
                                            Завдання{" "}
                                            {
                                              question.order
                                            }
                                          </p>

                                          <h4 className="mt-1 text-xl font-bold">
                                            Перегляд завдання
                                          </h4>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                          <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium">
                                            {getQuestionTypeLabel(
                                              details.type
                                            )}
                                          </span>

                                          <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium">
                                            {
                                              details.points
                                            }{" "}
                                            бал.
                                          </span>

                                          <span
                                            className={`rounded-full px-3 py-1.5 text-sm font-bold ${
                                              question.difficultyColor ===
                                              "green"
                                                ? "bg-green-100 text-green-700"
                                                : question.difficultyColor ===
                                                  "yellow"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : question.difficultyColor ===
                                                  "orange"
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                          >
                                            {
                                              question.difficulty
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-6 p-6">
                                      {/* =================================
                                          УМОВА
                                      ================================= */}

                                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                                        <div className="mb-4 flex items-center gap-3">
                                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3E8EA] font-bold text-[#7A1F2B]">
                                            {
                                              question.order
                                            }
                                          </div>

                                          <h5 className="text-lg font-bold text-gray-800">
                                            Умова завдання
                                          </h5>
                                        </div>

                                        <div className="whitespace-pre-wrap text-base leading-7 text-gray-800">
                                          {cleanText(
                                            details.text
                                          )}
                                        </div>
                                      </div>

                                      {/* =================================
                                          SINGLE / MULTIPLE
                                      ================================= */}

                                      {details.type !==
                                        "matching" &&
                                        details.type !==
                                          "sequence" && (
                                          <div className="rounded-xl border border-gray-200 bg-white p-6">
                                            <h5 className="mb-5 text-lg font-bold text-gray-800">
                                              Варіанти відповідей
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
                                                          ? "border-green-300 bg-green-50"
                                                          : "border-gray-200 bg-white"
                                                      }`}
                                                    >
                                                      <div className="flex items-start gap-4">
                                                        <div
                                                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold ${
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
                                                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-bold text-green-700">
                                                              <span>
                                                                ✓
                                                              </span>

                                                              <span>
                                                                Правильна відповідь
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

                                      {/* =================================
                                          MATCHING
                                      ================================= */}

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
                                                      className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 md:grid-cols-2"
                                                    >
                                                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                                                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                                          Елемент
                                                        </p>

                                                        <p className="mt-2 text-gray-800">
                                                          {cleanText(
                                                            left.text
                                                          )}
                                                        </p>
                                                      </div>

                                                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                                        <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                                                          Правильна відповідь
                                                        </p>

                                                        <p className="mt-2 text-gray-800">
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

                                      {/* =================================
                                          SEQUENCE
                                      ================================= */}

                                      {details.type ===
                                        "sequence" && (
                                        <div className="rounded-xl border border-gray-200 bg-white p-6">
                                          <h5 className="mb-5 text-lg font-bold text-gray-800">
                                            Встановлення послідовності
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
                                                    className={`flex items-center gap-4 rounded-xl border-2 p-4 ${
                                                      option.isCorrect
                                                        ? "border-green-300 bg-green-50"
                                                        : "border-gray-200 bg-white"
                                                    }`}
                                                  >
                                                    <div
                                                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold ${
                                                        option.isCorrect
                                                          ? "bg-green-600 text-white"
                                                          : "bg-gray-100 text-gray-600"
                                                      }`}
                                                    >
                                                      {index +
                                                        1}
                                                    </div>

                                                    <div className="flex-1 text-gray-800">
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

                                      {/* =================================
                                          STATISTICS
                                      ================================= */}

                                      <div>
                                        <h5 className="mb-4 text-lg font-bold text-gray-800">
                                          Статистика виконання
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
                                              <span className="text-base">
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
                                              <span className="text-base">
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
                                              <span className="text-base">
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
          <div className="border-b border-gray-200 bg-gradient-to-r from-[#7A1F2B] to-[#922C3A] px-6 py-5 text-white">
            <h3 className="text-xl font-bold">
              Шкала визначення складності завдань
            </h3>

            <p className="mt-1 text-sm text-white/75">
              Категорія визначається за
              часткою правильних відповідей
              учасників.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-5">
            {/* 0–20 */}

            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">
                  0–20%
                </span>

                <span className="h-3 w-3 rounded-full bg-red-500" />
              </div>

              <h4 className="font-bold text-red-700">
                Дуже складне
              </h4>

              <p className="mt-2 text-sm leading-5 text-red-600">
                Правильно відповіли до 20%
                учасників.
              </p>
            </div>

            {/* 20–40 */}

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">
                  20–40%
                </span>

                <span className="h-3 w-3 rounded-full bg-orange-500" />
              </div>

              <h4 className="font-bold text-orange-700">
                Складне
              </h4>

              <p className="mt-2 text-sm leading-5 text-orange-600">
                Правильно відповіли від
                20% до 40% учасників.
              </p>
            </div>

            {/* 40–60 */}

            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-yellow-600">
                  40–60%
                </span>

                <span className="h-3 w-3 rounded-full bg-yellow-500" />
              </div>

              <h4 className="font-bold text-yellow-700">
                Оптимальне
              </h4>

              <p className="mt-2 text-sm leading-5 text-yellow-700">
                Правильно відповіли від
                40% до 60% учасників.
              </p>
            </div>

            {/* 60–80 */}

            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">
                  60–80%
                </span>

                <span className="h-3 w-3 rounded-full bg-green-500" />
              </div>

              <h4 className="font-bold text-green-700">
                Легке
              </h4>

              <p className="mt-2 text-sm leading-5 text-green-600">
                Правильно відповіли від
                60% до 80% учасників.
              </p>
            </div>

            {/* 80–100 */}

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-emerald-600">
                  80–100%
                </span>

                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>

              <h4 className="font-bold text-emerald-700">
                Дуже легке
              </h4>

              <p className="mt-2 text-sm leading-5 text-emerald-600">
                Правильно відповіли від
                80% до 100% учасників.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
            <p className="text-sm leading-6 text-gray-500">
              <span className="font-semibold text-gray-700">
                Примітка:
              </span>{" "}
              межі категорій використовуються
              для інтерпретації складності
              завдань в аналітиці тестування.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}