"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import Link from "next/link";

// =====================================================
// TYPES
// =====================================================

type Difficulty =
  | "VERY_EASY"
  | "EASY"
  | "OPTIMAL"
  | "DIFFICULT"
  | "VERY_DIFFICULT";

type Participant = {
  id: number;
  participantId?: number | null;
  sessionId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  earnedPoints: number;
  maxPoints: number;
  percent: number;
  correct: number;
  incorrect: number;
  skipped: number;
  createdAt: string;
};

type AnswerDistributionItem = {
  label: string;
  value: number;
};

type Psychometrics = {
  key: string | null;
  pValue: number | null;
  dIndex: number | null;
  rit: number | null;
  answerDistribution: AnswerDistributionItem[];
  insufficientData?: boolean;
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
  total: number;
  correctPercent: number;
  incorrectPercent: number;
  skippedPercent: number;
  difficulty: Difficulty;
  difficultyColor?: string;

  // Психометричні показники додаються опційно,
  // тому стара аналітика продовжує працювати,
  // навіть якщо API їх ще не повертає.
  psychometrics?: Psychometrics | null;
};

type AnalyticsData = {
  test: {
    id: number;
    title: string;
    subject?: string | null;
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

  options: {
    id: number;
    order: number;
    text: string;
    isCorrect: boolean;
  }[];
};

// =====================================================
// HELPERS
// =====================================================

function getDifficultyData(
  difficulty: Difficulty
): {
  label: string;
  shortLabel: string;
  description: string;
} {
  switch (difficulty) {
    case "VERY_EASY":
      return {
        label: "Дуже легке",
        shortLabel: "Дуже легке",
        description:
          "Понад 80% учасників виконали завдання правильно.",
      };

    case "EASY":
      return {
        label: "Легке",
        shortLabel: "Легке",
        description:
          "60–80% учасників виконали завдання правильно.",
      };

    case "OPTIMAL":
      return {
        label: "Оптимальне",
        shortLabel: "Оптимальне",
        description:
          "40–59% учасників виконали завдання правильно.",
      };

    case "DIFFICULT":
      return {
        label: "Складне",
        shortLabel: "Складне",
        description:
          "21–39% учасників виконали завдання правильно.",
      };

    case "VERY_DIFFICULT":
      return {
        label: "Дуже складне",
        shortLabel: "Дуже складне",
        description:
          "Не більше 20% учасників виконали завдання правильно.",
      };
  }
}

function getDifficultyClasses(difficulty: Difficulty): string {
  switch (difficulty) {
    case "VERY_EASY":
      return "bg-green-100 text-green-800 border-green-200";

    case "EASY":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";

    case "OPTIMAL":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";

    case "DIFFICULT":
      return "bg-orange-100 text-orange-800 border-orange-200";

    case "VERY_DIFFICULT":
      return "bg-red-100 text-red-800 border-red-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getDifficultyScaleClasses(
  difficulty: Difficulty,
  active: boolean
): string {
  const base =
    "flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium transition";

  if (!active) {
    return `${base} border-gray-200 bg-gray-50 text-gray-400`;
  }

  switch (difficulty) {
    case "VERY_EASY":
      return `${base} border-green-300 bg-green-100 text-green-800`;

    case "EASY":
      return `${base} border-emerald-300 bg-emerald-100 text-emerald-800`;

    case "OPTIMAL":
      return `${base} border-yellow-300 bg-yellow-100 text-yellow-800`;

    case "DIFFICULT":
      return `${base} border-orange-300 bg-orange-100 text-orange-800`;

    case "VERY_DIFFICULT":
      return `${base} border-red-300 bg-red-100 text-red-800`;

    default:
      return `${base} border-gray-200 bg-gray-50 text-gray-400`;
  }
}

function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case "SINGLE":
    case "SINGLE_CHOICE":
      return "Одна відповідь";

    case "MULTIPLE":
    case "MULTIPLE_CHOICE":
      return "Кілька відповідей";

    case "MATCHING":
      return "Встановлення відповідності";

    case "SEQUENCE":
    case "ORDER":
      return "Встановлення послідовності";

    case "SHORT_TEXT":
    case "TEXT":
      return "Коротка відповідь";

    default:
      return type;
  }
}

function cleanText(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getMatchingParts(text: string): {
  leftId: number;
  leftText: string;
  rightId: number;
} | null {
  const parts = text.split("|");

  if (parts.length < 4) {
    return null;
  }

  const leftId = Number(parts[1]);
  const rightId = Number(parts[3]);

  if (!Number.isFinite(leftId) || !Number.isFinite(rightId)) {
    return null;
  }

  return {
    leftId,
    leftText: parts[2],
    rightId,
  };
}

function getParticipantName(participant: Participant): string {
  const parts = [
    participant.lastName,
    participant.firstName,
    participant.middleName,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return `Учасник #${participant.id}`;
}

function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return value.toLocaleString("uk-UA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPercent(
  value: number | null | undefined
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${formatNumber(value, 1)}%`;
}

function formatPsychometricValue(
  value: number | null | undefined,
  digits = 2
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return formatNumber(value, digits);
}

// =====================================================
// COMPONENT
// =====================================================

export default function AnalyticsClient({
  testId,
}: {
  testId: string;
}) {
  // ===================================================
  // STATE
  // ===================================================

  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [expandedQuestion, setExpandedQuestion] =
    useState<number | null>(null);

  const [questionDetails, setQuestionDetails] =
    useState<QuestionDetails | null>(null);

  const [loadingQuestion, setLoadingQuestion] =
    useState(false);

  // ---------------------------------------------------
  // PARTICIPANT FILTER
  // ---------------------------------------------------

  const [participantMode, setParticipantMode] = useState<
    "all" | "selected"
  >("all");

  const [selectedParticipantIds, setSelectedParticipantIds] =
    useState<number[]>([]);

  const [appliedParticipantIds, setAppliedParticipantIds] =
    useState<number[]>([]);

  const [applyingFilter, setApplyingFilter] =
    useState(false);

  // ===================================================
  // LOAD ANALYTICS
  // ===================================================

  async function loadAnalytics(
    participantIds?: number[],
    signal?: AbortSignal
  ) {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      params.set("testId", testId);

      if (participantIds && participantIds.length > 0) {
        params.set(
          "participantIds",
          participantIds.join(",")
        );
      }

      const response = await fetch(
        `/api/analytics?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          signal,
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.error ||
            "Не вдалося завантажити аналітику."
        );
      }

      const data =
        (await response.json()) as AnalyticsData;

      setAnalytics(data);

      // -------------------------------------------------
      // First load:
      // select all participants
      // -------------------------------------------------

      if (
        selectedParticipantIds.length === 0 &&
        data.participants.length > 0
      ) {
        const ids = data.participants.map(
          (participant) => participant.id
        );

        setSelectedParticipantIds(ids);

        if (appliedParticipantIds.length === 0) {
          setAppliedParticipantIds([]);
        }
      }
    } catch (err) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return;
      }

      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Сталася помилка під час завантаження аналітики."
      );
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    const controller = new AbortController();

    loadAnalytics(undefined, controller.signal);

    return () => {
      controller.abort();
    };

    // Intentionally only on testId change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // ===================================================
  // PARTICIPANT FILTER HELPERS
  // ===================================================

  function toggleParticipant(participantId: number) {
    setSelectedParticipantIds((current) => {
      if (current.includes(participantId)) {
        return current.filter(
          (id) => id !== participantId
        );
      }

      return [...current, participantId];
    });
  }

  function selectAllParticipants() {
    if (!analytics) return;

    setSelectedParticipantIds(
      analytics.participants.map(
        (participant) => participant.id
      )
    );
  }

  function clearParticipants() {
    setSelectedParticipantIds([]);
  }

  async function applyParticipantFilter() {
    if (!analytics) return;

    try {
      setApplyingFilter(true);

      if (participantMode === "all") {
        setAppliedParticipantIds([]);

        await loadAnalytics([]);
      } else {
        setAppliedParticipantIds(
          selectedParticipantIds
        );

        await loadAnalytics(
          selectedParticipantIds
        );
      }

      setExpandedQuestion(null);
      setQuestionDetails(null);
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingFilter(false);
    }
  }

  // ===================================================
  // QUESTION DETAILS
  // ===================================================

  async function toggleQuestion(questionId: number) {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
      setQuestionDetails(null);
      return;
    }

    try {
      setExpandedQuestion(questionId);
      setQuestionDetails(null);
      setLoadingQuestion(true);

      const params = new URLSearchParams();

      params.set("testId", testId);
      params.set(
        "questionId",
        String(questionId)
      );

      const response = await fetch(
        `/api/analytics/question?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.error ||
            "Не вдалося завантажити інформацію про питання."
        );
      }

      const data =
        (await response.json()) as QuestionDetails;

      setQuestionDetails(data);
    } catch (err) {
      console.error(err);
      setQuestionDetails(null);
    } finally {
      setLoadingQuestion(false);
    }
  }

  // ===================================================
  // DIFFICULTY DISTRIBUTION
  // ===================================================

  const difficultyCounts = useMemo(() => {
    const counts: Record<Difficulty, number> = {
      VERY_EASY: 0,
      EASY: 0,
      OPTIMAL: 0,
      DIFFICULT: 0,
      VERY_DIFFICULT: 0,
    };

    if (!analytics) {
      return counts;
    }

    for (const question of analytics.questions) {
      if (
        counts[question.difficulty] !== undefined
      ) {
        counts[question.difficulty] += 1;
      }
    }

    return counts;
  }, [analytics]);

  const totalQuestions =
    analytics?.questions.length ?? 0;

  // ===================================================
  // RENDER: LOADING
  // ===================================================

  if (loading && !analytics) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

          <p className="text-sm text-gray-500">
            Завантаження аналітики…
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER: ERROR
  // ===================================================

  if (error && !analytics) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-800">
          Не вдалося завантажити аналітику
        </h2>

        <p className="mt-2 text-sm text-red-700">
          {error}
        </p>

        <button
          type="button"
          onClick={() => loadAnalytics()}
          className="mt-4 rounded-lg bg-[#7A1F2B] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Спробувати ще раз
        </button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // ===================================================
  // DATA
  // ===================================================

  const {
    test,
    summary,
    participants,
    questions,
  } = analytics;

  const selectedCount =
    selectedParticipantIds.length;

  const allSelected =
    participants.length > 0 &&
    selectedParticipantIds.length ===
      participants.length;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link
              href="/admin/tests"
              className="text-sm text-gray-500 transition hover:text-[#7A1F2B]"
            >
              ← Тести
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Аналітика тестування
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {test.title}
          </p>

          {test.subject && (
            <p className="mt-1 text-sm text-gray-400">
              Предмет: {test.subject}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/tests/${test.id}`}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Редагувати тест
          </Link>
        </div>
      </div>

      {/* =================================================
          PARTICIPANT FILTER
      ================================================= */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-gray-900">
              Учасники
            </h2>

            <p className="text-sm text-gray-500">
              Оберіть учасників, результати яких потрібно
              врахувати в аналітиці.
            </p>
          </div>

          {/* MODE */}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setParticipantMode("all")
              }
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                participantMode === "all"
                  ? "border-[#7A1F2B] bg-[#7A1F2B] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Усі учасники
            </button>

            <button
              type="button"
              onClick={() =>
                setParticipantMode("selected")
              }
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                participantMode === "selected"
                  ? "border-[#7A1F2B] bg-[#7A1F2B] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Обрані учасники
            </button>
          </div>

          {/* PARTICIPANTS */}

          {participantMode === "selected" && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-600">
                  Обрано:{" "}
                  <span className="font-semibold text-gray-900">
                    {selectedCount}
                  </span>{" "}
                  із {participants.length}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllParticipants}
                    disabled={allSelected}
                    className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Обрати всіх
                  </button>

                  <button
                    type="button"
                    onClick={clearParticipants}
                    disabled={selectedCount === 0}
                    className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Очистити
                  </button>
                </div>
              </div>

              {participants.length > 0 ? (
                <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                  {participants.map((participant) => {
                    const checked =
                      selectedParticipantIds.includes(
                        participant.id
                      );

                    return (
                      <label
                        key={participant.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleParticipant(
                              participant.id
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 text-[#7A1F2B] focus:ring-[#7A1F2B]"
                        />

                        <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
                          {getParticipantName(
                            participant
                          )}
                        </span>

                        <span className="text-xs text-gray-400">
                          {formatNumber(
                            participant.earnedPoints,
                            2
                          )}{" "}
                          /{" "}
                          {formatNumber(
                            participant.maxPoints,
                            2
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-gray-500">
                  Немає учасників.
                </p>
              )}
            </div>
          )}

          {/* APPLY */}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-gray-400">
              {appliedParticipantIds.length > 0
                ? `Застосовано вибір: ${appliedParticipantIds.length} учасників`
                : "Аналітика побудована за всіма учасниками"}
            </div>

            <button
              type="button"
              onClick={applyParticipantFilter}
              disabled={
                applyingFilter ||
                (participantMode === "selected" &&
                  selectedParticipantIds.length === 0)
              }
              className="rounded-lg bg-[#7A1F2B] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applyingFilter
                ? "Застосування…"
                : "Застосувати"}
            </button>
          </div>
        </div>
      </section>

      {/* =================================================
          ERROR WHILE REFRESHING
      ================================================= */}

      {error && analytics && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* PARTICIPANTS */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">
            Учасників
          </div>

          <div className="mt-2 text-3xl font-bold text-gray-900">
            {summary.participants}
          </div>
        </div>

        {/* MAX */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">
            Максимальний результат
          </div>

          <div className="mt-2 text-3xl font-bold text-gray-900">
            {formatNumber(summary.maxScore, 2)}
          </div>

          <div className="mt-1 text-xs text-gray-400">
            із {formatNumber(test.maxPoints, 2)} балів
          </div>
        </div>

        {/* MIN */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">
            Мінімальний результат
          </div>

          <div className="mt-2 text-3xl font-bold text-gray-900">
            {formatNumber(summary.minScore, 2)}
          </div>

          <div className="mt-1 text-xs text-gray-400">
            із {formatNumber(test.maxPoints, 2)} балів
          </div>
        </div>

        {/* AVERAGE */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">
            Середній результат
          </div>

          <div className="mt-2 text-3xl font-bold text-gray-900">
            {formatNumber(summary.averageScore, 2)}
          </div>

          <div className="mt-1 text-xs text-gray-400">
            балів
          </div>
        </div>

        {/* PERCENT */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">
            Середній відсоток
          </div>

          <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {formatNumber(
              summary.averagePercent,
              1
            )}
            %
          </div>
        </div>
      </section>

      {/* =================================================
          DIFFICULTY DISTRIBUTION
      ================================================= */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Розподіл завдань за складністю
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Кількість завдань кожного рівня складності.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              "VERY_EASY",
              "EASY",
              "OPTIMAL",
              "DIFFICULT",
              "VERY_DIFFICULT",
            ] as Difficulty[]
          ).map((difficulty) => {
            const data =
              getDifficultyData(difficulty);

            const count =
              difficultyCounts[difficulty];

            return (
              <div
                key={difficulty}
                className={`rounded-xl border p-4 ${getDifficultyClasses(
                  difficulty
                )}`}
              >
                <div className="text-sm font-medium">
                  {data.label}
                </div>

                <div className="mt-2 text-3xl font-bold">
                  {count}
                </div>

                <div className="mt-1 text-xs opacity-75">
                  {totalQuestions > 0
                    ? `${formatNumber(
                        (count / totalQuestions) *
                          100,
                        1
                      )}% від усіх`
                    : "0% від усіх"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =================================================
          QUESTIONS TABLE
      ================================================= */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Аналіз завдань
            </h2>

            <p className="text-sm text-gray-500">
              Статистичні показники виконання кожного завдання.
            </p>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Немає завдань для відображення.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">
                    №
                  </th>

                  <th className="px-4 py-3">
                    Питання
                  </th>

                  <th className="px-4 py-3">
                    Тип
                  </th>

                  <th className="px-4 py-3 text-center">
                    Правильно
                  </th>

                  <th className="px-4 py-3 text-center">
                    Неправильно
                  </th>

                  <th className="px-4 py-3 text-center">
                    Пропущено
                  </th>

                  <th className="px-4 py-3 text-center">
                    Складність
                  </th>

                  <th className="px-4 py-3 text-center">
                    Дія
                  </th>
                </tr>
              </thead>

              <tbody>
                {questions.map((question) => {
                  const isExpanded =
                    expandedQuestion ===
                    question.id;

                  const difficulty =
                    getDifficultyData(
                      question.difficulty
                    );

                  return (
                    <Fragment key={question.id}>
                      <tr
                        className={`border-b border-gray-100 transition ${
                          isExpanded
                            ? "bg-gray-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {/* NUMBER */}

                        <td className="px-4 py-4 align-top">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-700">
                            {question.order}
                          </div>
                        </td>

                        {/* QUESTION */}

                        <td className="max-w-[430px] px-4 py-4 align-top">
                          <div className="line-clamp-3 text-sm font-medium leading-5 text-gray-900">
                            {cleanText(
                              question.text
                            )}
                          </div>

                          <div className="mt-1 text-xs text-gray-400">
                            {question.points}{" "}
                            {question.points === 1
                              ? "бал"
                              : "бали"}
                          </div>
                        </td>

                        {/* TYPE */}

                        <td className="px-4 py-4 align-top">
                          <span className="text-sm text-gray-600">
                            {getQuestionTypeLabel(
                              question.type
                            )}
                          </span>
                        </td>

                        {/* CORRECT */}

                        <td className="px-4 py-4 text-center align-top">
                          <div className="font-semibold text-green-700">
                            {question.correct}
                          </div>

                          <div className="mt-1 text-xs text-gray-400">
                            {formatPercent(
                              question.correctPercent
                            )}
                          </div>
                        </td>

                        {/* INCORRECT */}

                        <td className="px-4 py-4 text-center align-top">
                          <div className="font-semibold text-red-700">
                            {question.incorrect}
                          </div>

                          <div className="mt-1 text-xs text-gray-400">
                            {formatPercent(
                              question.incorrectPercent
                            )}
                          </div>
                        </td>

                        {/* SKIPPED */}

                        <td className="px-4 py-4 text-center align-top">
                          <div className="font-semibold text-gray-700">
                            {question.skipped}
                          </div>

                          <div className="mt-1 text-xs text-gray-400">
                            {formatPercent(
                              question.skippedPercent
                            )}
                          </div>
                        </td>

                        {/* DIFFICULTY */}

                        <td className="px-4 py-4 text-center align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getDifficultyClasses(
                              question.difficulty
                            )}`}
                            title={
                              difficulty.description
                            }
                          >
                            {difficulty.shortLabel}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td className="px-4 py-4 text-center align-top">
                          <button
                            type="button"
                            onClick={() =>
                              toggleQuestion(
                                question.id
                              )
                            }
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-[#7A1F2B] hover:text-[#7A1F2B]"
                          >
                            {isExpanded
                              ? "Згорнути"
                              : "Деталі"}
                          </button>
                        </td>
                      </tr>

                      {/* =================================================
                          EXPANDED QUESTION
                      ================================================= */}

                      {isExpanded && (
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <td
                            colSpan={8}
                            className="px-5 py-5"
                          >
                            {loadingQuestion ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#7A1F2B]" />

                                  Завантаження…
                                </div>
                              </div>
                            ) : !questionDetails ? (
                              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                Не вдалося завантажити деталі
                                питання.
                              </div>
                            ) : (
                              <div className="space-y-5">
                                {/* QUESTION HEADER */}

                                <div>
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-[#7A1F2B] px-2.5 py-1 text-xs font-semibold text-white">
                                      Завдання{" "}
                                      {
                                        questionDetails.order
                                      }
                                    </span>

                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                                      {getQuestionTypeLabel(
                                        questionDetails.type
                                      )}
                                    </span>

                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                                      {
                                        questionDetails.points
                                      }{" "}
                                      {questionDetails.points ===
                                      1
                                        ? "бал"
                                        : "бали"}
                                    </span>
                                  </div>

                                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                      Умова
                                    </div>

                                    <div className="whitespace-pre-wrap text-sm leading-6 text-gray-800">
                                      {cleanText(
                                        questionDetails.text
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* OPTIONS */}

                                {questionDetails
                                  .options.length >
                                  0 && (
                                  <div>
                                    <div className="mb-3 text-sm font-semibold text-gray-900">
                                      Варіанти відповідей
                                    </div>

                                    <div className="space-y-2">
                                      {questionDetails.options.map(
                                        (
                                          option,
                                          index
                                        ) => {
                                          const letter =
                                            String.fromCharCode(
                                              65 + index
                                            );

                                          const matching =
                                            getMatchingParts(
                                              option.text
                                            );

                                          return (
                                            <div
                                              key={
                                                option.id
                                              }
                                              className={`rounded-lg border p-3 ${
                                                option.isCorrect
                                                  ? "border-green-200 bg-green-50"
                                                  : "border-gray-200 bg-white"
                                              }`}
                                            >
                                              <div className="flex items-start gap-3">
                                                <div
                                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                                                    option.isCorrect
                                                      ? "bg-green-600 text-white"
                                                      : "bg-gray-100 text-gray-700"
                                                  }`}
                                                >
                                                  {
                                                    letter
                                                  }
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                  {matching ? (
                                                    <div>
                                                      <div className="text-sm font-medium text-gray-900">
                                                        {cleanText(
                                                          matching.leftText
                                                        )}
                                                      </div>

                                                      <div className="mt-1 text-xs text-gray-500">
                                                        Правильна
                                                        права
                                                        частина:{" "}
                                                        {
                                                          matching.rightId
                                                        }
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="whitespace-pre-wrap text-sm text-gray-800">
                                                      {cleanText(
                                                        option.text
                                                      )}
                                                    </div>
                                                  )}
                                                </div>

                                                {option.isCorrect && (
                                                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                                    Правильна
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* QUESTION STATISTICS */}

                                <div>
                                  <div className="mb-3 text-sm font-semibold text-gray-900">
                                    Статистика виконання
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                      <div className="text-xs text-green-700">
                                        Правильно
                                      </div>

                                      <div className="mt-1 text-xl font-bold text-green-800">
                                        {
                                          question.correct
                                        }
                                      </div>

                                      <div className="mt-1 text-xs text-green-700">
                                        {formatPercent(
                                          question.correctPercent
                                        )}
                                      </div>
                                    </div>

                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                      <div className="text-xs text-red-700">
                                        Неправильно
                                      </div>

                                      <div className="mt-1 text-xl font-bold text-red-800">
                                        {
                                          question.incorrect
                                        }
                                      </div>

                                      <div className="mt-1 text-xs text-red-700">
                                        {formatPercent(
                                          question.incorrectPercent
                                        )}
                                      </div>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                                      <div className="text-xs text-gray-500">
                                        Пропущено
                                      </div>

                                      <div className="mt-1 text-xl font-bold text-gray-800">
                                        {
                                          question.skipped
                                        }
                                      </div>

                                      <div className="mt-1 text-xs text-gray-500">
                                        {formatPercent(
                                          question.skippedPercent
                                        )}
                                      </div>
                                    </div>

                                    <div
                                      className={`rounded-lg border p-4 ${getDifficultyClasses(
                                        question.difficulty
                                      )}`}
                                    >
                                      <div className="text-xs opacity-80">
                                        Складність
                                      </div>

                                      <div className="mt-1 text-lg font-bold">
                                        {
                                          difficulty.label
                                        }
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* =================================================
                                    PSYCHOMETRICS
                                ================================================= */}

                                {question.psychometrics && (
                                  <div>
                                    <div className="mb-3 text-sm font-semibold text-gray-900">
                                      Психометричні показники
                                    </div>

                                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                                      <table className="w-full min-w-[760px] border-collapse">
                                        <thead>
                                          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            <th className="px-4 py-3">
                                              Ключ
                                            </th>

                                            <th className="px-4 py-3">
                                              Розподіл відповідей
                                            </th>

                                            <th className="px-4 py-3 text-center">
                                              P-value
                                            </th>

                                            <th className="px-4 py-3 text-center">
                                              D-index
                                            </th>

                                            <th className="px-4 py-3 text-center">
                                              Rit
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          <tr>
                                            <td className="px-4 py-4 align-top">
                                              <span className="font-semibold text-gray-900">
                                                {question
                                                  .psychometrics
                                                  .key ||
                                                  "—"}
                                              </span>
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                              {question
                                                .psychometrics
                                                .answerDistribution
                                                .length >
                                              0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                  {question.psychometrics.answerDistribution.map(
                                                    (
                                                      item
                                                    ) => (
                                                      <span
                                                        key={`${item.label}-${item.value}`}
                                                        className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                                      >
                                                        <span className="font-semibold">
                                                          {
                                                            item.label
                                                          }
                                                        </span>{" "}
                                                        {formatPercent(
                                                          item.value
                                                        )}
                                                      </span>
                                                    )
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-sm text-gray-400">
                                                  —
                                                </span>
                                              )}
                                            </td>

                                            <td className="px-4 py-4 text-center align-top font-medium text-gray-900">
                                              {formatPercent(
                                                question
                                                  .psychometrics
                                                  .pValue
                                              )}
                                            </td>

                                            <td className="px-4 py-4 text-center align-top font-medium text-gray-900">
                                              {formatPsychometricValue(
                                                question
                                                  .psychometrics
                                                  .dIndex,
                                                1
                                              )}
                                            </td>

                                            <td className="px-4 py-4 text-center align-top font-medium text-gray-900">
                                              {formatPsychometricValue(
                                                question
                                                  .psychometrics
                                                  .rit,
                                                2
                                              )}
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>

                                    {question
                                      .psychometrics
                                      .insufficientData && (
                                      <p className="mt-2 text-xs text-gray-400">
                                        Для частини психометричних
                                        показників недостатньо
                                        даних.
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* CLOSE */}

                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandedQuestion(
                                        null
                                      );

                                      setQuestionDetails(
                                        null
                                      );
                                    }}
                                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                  >
                                    Згорнути деталі
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =================================================
          DIFFICULTY SCALE
      ================================================= */}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Шкала складності
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Класифікація завдань за часткою правильних
            відповідей.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          {(
            [
              "VERY_EASY",
              "EASY",
              "OPTIMAL",
              "DIFFICULT",
              "VERY_DIFFICULT",
            ] as Difficulty[]
          ).map((difficulty) => {
            const data =
              getDifficultyData(difficulty);

            return (
              <div
                key={difficulty}
                className={getDifficultyScaleClasses(
                  difficulty,
                  true
                )}
              >
                <div>{data.label}</div>

                <div className="mt-1 text-[11px] opacity-75">
                  {data.description}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}