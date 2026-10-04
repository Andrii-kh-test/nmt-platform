"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import HtmlContent from "@/app/components/common/HtmlContent";
// =====================================================
// TYPES
// =====================================================

type Props = {
  resultId: number;
};

type Difficulty =
  | "Дуже складне"
  | "Складне"
  | "Оптимальне"
  | "Легке"
  | "Дуже легке";

type QuestionStatus =
  | "correct"
  | "incorrect"
  | "skipped"
  | "partial";

type QuestionOption = {
  id: number;
  order: number;
  text: string;
  isCorrect: boolean;
};

type QuestionDetails = {
  id: number;
  order: number;
  type: string;
  text: string;
  points: number;
  options: QuestionOption[];
  participantAnswer: unknown;
};

type ParticipantQuestion = {
  id: number;
  order: number;
  type: string;
  points: number;
  earnedPoints: number;
  status: QuestionStatus;
  percent: number;
  difficulty: string;
  details: QuestionDetails | null;
};

type ParticipantAnalytics = {
  resultId: number;

  earnedPoints: number;
  maxPoints: number;
  percent: number;

  correct: number;
  incorrect: number;
  skipped: number;

  timeSpent: number | null;

  createdAt: string;
  finishedAt: string | null;
  startedAt: string | null;

  differenceFromAverage: number | null;
  percentile: number | null;
};

type AnalyticsData = {
  success: boolean;

  test: {
    id: number;
    title: string;
    subject: string | null;
    maxPoints: number;
  };

  groupStatistics: {
    participants: number;

    maxScore: number | null;
    minScore: number | null;

    averageScore: number | null;
    averagePercent: number | null;
  };

  participant: ParticipantAnalytics;

  allowParticipantDetails: boolean;

  questions: ParticipantQuestion[];
};
// =====================================================
// HELPERS
// =====================================================

function cleanText(
  value: string | null | undefined
) {
  if (!value) return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPercent(
  value: number | null | undefined
) {
  return `${Number(value || 0).toLocaleString(
    "uk-UA",
    {
      maximumFractionDigits: 2,
    }
  )}%`;
}

function formatNumber(
  value: number | null | undefined
) {
  return Number(value || 0).toLocaleString(
    "uk-UA",
    {
      maximumFractionDigits: 2,
    }
  );
}

/**
 * timeSpent зберігається в секундах.
 */
function formatTime(
  seconds: number | null | undefined
) {
  if (
    seconds === null ||
    seconds === undefined ||
    !Number.isFinite(Number(seconds))
  ) {
    return "—";
  }

  const totalSeconds = Math.max(
    0,
    Math.round(Number(seconds))
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(
    2,
    "0"
  )}`;
}

function getDifficultyData(
  difficulty: string
) {
  switch (difficulty) {
    case "Дуже складне":
      return {
        label: "Дуже складне",
        classes:
          "border-red-200 bg-red-50 text-red-700",
        dot: "bg-red-500",
      };

    case "Складне":
      return {
        label: "Складне",
        classes:
          "border-orange-200 bg-orange-50 text-orange-700",
        dot: "bg-orange-500",
      };

    case "Оптимальне":
      return {
        label: "Оптимальне",
        classes:
          "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-400",
      };

    case "Легке":
      return {
        label: "Легке",
        classes:
          "border-green-200 bg-green-50 text-green-700",
        dot: "bg-green-500",
      };

    case "Дуже легке":
      return {
        label: "Дуже легке",
        classes:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
      };

    default:
      return {
        label: difficulty,
        classes:
          "border-gray-200 bg-gray-50 text-gray-700",
        dot: "bg-gray-400",
      };
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

    case "text":
      return "Відкрита відповідь";

    default:
      return type;
  }
}

function getStatusData(
  status: QuestionStatus
) {
  switch (status) {
    case "correct":
      return {
        label: "Правильно",
        classes:
          "border-green-200 bg-green-50 text-green-700",
        icon: "✓",
      };

    case "partial":
      return {
        label: "Частково",
        classes:
          "border-amber-200 bg-amber-50 text-amber-700",
        icon: "◐",
      };

    case "incorrect":
      return {
        label: "Неправильно",
        classes:
          "border-red-200 bg-red-50 text-red-700",
        icon: "×",
      };

    case "skipped":
      return {
        label: "Пропущено",
        classes:
          "border-gray-200 bg-gray-50 text-gray-600",
        icon: "—",
      };

    default:
      return {
        label: "—",
        classes:
          "border-gray-200 bg-gray-50 text-gray-600",
        icon: "—",
      };
  }
}

// =====================================================
// MATCHING
// =====================================================

function getMatchingParts(
  options: QuestionOption[]
) {
  const left: Array<{
    id: number;
    text: string;
    correctRightId: number;
  }> = [];

  const right: Array<{
    id: number;
    text: string;
  }> = [];

  options.forEach((option) => {
    if (option.text?.startsWith("L|")) {
      const parts = option.text.split("|");

      const id = Number(parts[1]);
      const text = parts[2] ?? "";
      const correctRightId = Number(parts[3]);

      if (
        Number.isInteger(id) &&
        Number.isInteger(correctRightId)
      ) {
        left.push({
          id,
          text,
          correctRightId,
        });
      }

      return;
    }

    if (option.text?.startsWith("R|")) {
      const parts = option.text.split("|");

      const id = Number(parts[1]);
      const text = parts[2] ?? "";

      if (Number.isInteger(id)) {
        right.push({
          id,
          text,
        });
      }

      return;
    }

    right.push({
      id: option.id,
      text: option.text,
    });
  });

  left.sort((a, b) => a.id - b.id);
  right.sort((a, b) => a.id - b.id);

  return {
    left,
    right,
  };
}

// =====================================================
// PARTICIPANT ANSWER HELPERS
// =====================================================

function getParticipantAnswerIds(
  value: unknown
): number[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) =>
        Number.isInteger(item)
      );
  }

  if (
    typeof value === "number" &&
    Number.isInteger(value)
  ) {
    return [value];
  }

  if (typeof value === "string") {
    const number = Number(value);

    if (Number.isInteger(number)) {
      return [number];
    }
  }

  return [];
}

function getParticipantAnswerLabel(
  question: QuestionDetails
) {
  const answer =
    question.participantAnswer;

  if (
    answer === null ||
    answer === undefined
  ) {
    return "Відповідь не надано";
  }

  if (question.type === "matching") {
    if (
      !answer ||
      typeof answer !== "object" ||
      Array.isArray(answer)
    ) {
      return "Відповідь не надано";
    }

    return "Відповідності встановлено";
  }

  const ids =
    getParticipantAnswerIds(answer);

  if (ids.length === 0) {
    return "Відповідь не надано";
  }

  const selected =
    question.options.filter((option) =>
      ids.includes(option.id)
    );

  if (selected.length === 0) {
    return "Відповідь не надано";
  }

  return selected
    .map((option) =>
      cleanText(option.text)
    )
    .join(", ");
}

// =====================================================
// COMPONENT
// =====================================================

export default function ParticipantAnalyticsClient({
  resultId,
}: Props) {
  const router = useRouter();

  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [expandedQuestion, setExpandedQuestion] =
    useState<number | null>(null);

  const [downloadingPdf, setDownloadingPdf] =
    useState(false);

  // ===================================================
  // LOAD PARTICIPANT ANALYTICS
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch(
            `/api/participant/analytics?resultId=${resultId}`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ??
              "Не вдалося завантажити аналітику."
          );
        }

        if (
          !data ||
          data.success !== true
        ) {
          throw new Error(
            data?.error ??
              "Не вдалося завантажити аналітику."
          );
        }

        if (cancelled) return;

        setAnalytics(data as AnalyticsData);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося завантажити аналітику."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [resultId]);

  // ===================================================
  // DIFFICULTY COUNTS
  // ===================================================

  const difficultyCounts = useMemo(() => {
    const counts: Record<
      Difficulty,
      number
    > = {
      "Дуже складне": 0,
      Складне: 0,
      Оптимальне: 0,
      Легке: 0,
      "Дуже легке": 0,
    };

    analytics?.questions.forEach(
      (question) => {
        const difficulty =
          question.difficulty as Difficulty;

        if (
          Object.prototype.hasOwnProperty.call(
            counts,
            difficulty
          )
        ) {
          counts[difficulty]++;
        }
      }
    );

    return counts;
  }, [analytics]);

  // ===================================================
  // MAX / MIN PERCENT
  // ===================================================

  const maxScorePercent =
    analytics &&
    analytics.test.maxPoints > 0 &&
    analytics.groupStatistics
      .maxScore !== null
      ? Math.round(
          (analytics.groupStatistics.maxScore /
            analytics.test.maxPoints) *
            10000
        ) / 100
      : 0;

  const minScorePercent =
    analytics &&
    analytics.test.maxPoints > 0 &&
    analytics.groupStatistics
      .minScore !== null
      ? Math.round(
          (analytics.groupStatistics.minScore /
            analytics.test.maxPoints) *
            10000
        ) / 100
      : 0;

  // ===================================================
  // PDF
  // ===================================================

  async function downloadPdf() {
    if (!analytics) {
      return;
    }

    try {
      setDownloadingPdf(true);

      const response =
        await fetch(
          `/api/analytics/pdf?testId=${analytics.test.id}&mode=simple`,
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Не вдалося сформувати PDF."
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = `аналітика-${resultId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Не вдалося завантажити PDF."
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  // ===================================================
  // QUESTION TOGGLE
  // ===================================================

  function toggleQuestion(
    question: ParticipantQuestion
  ) {
    if (!analytics?.allowParticipantDetails) {
      return;
    }

    if (!question.details) {
      return;
    }

    setExpandedQuestion(
      (current) =>
        current === question.id
          ? null
          : question.id
    );
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4f5]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-[28px] border border-[#eadde0] bg-white p-12 text-center shadow-[0_12px_40px_rgba(122,31,43,0.07)]">
            <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-[#eadde0] border-t-[#7A1F2B]" />

            <p className="font-medium text-gray-600">
              Завантаження аналітики…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-[#f7f4f5]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-[28px] border border-red-200 bg-white p-8 shadow-[0_12px_40px_rgba(122,31,43,0.07)]">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl text-red-600">
              !
            </div>

            <h1 className="text-xl font-bold text-gray-900">
              Не вдалося завантажити аналітику
            </h1>

            <p className="mt-2 text-gray-600">
              {error ??
                "Результат не знайдено."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/cabinet/analytics"
                )
              }
              className="mt-6 rounded-xl bg-[#7A1F2B] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#641923]"
            >
              ← До моїх результатів
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // DATA
  // ===================================================

  const participant =
    analytics.participant;

  const participantPercent =
    Number(participant.percent ?? 0);

  const detailsAllowed =
    analytics.allowParticipantDetails;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-[#f7f4f5]">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="relative overflow-hidden bg-[#7A1F2B] text-white">
        <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-black/5" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/cabinet/analytics"
              )
            }
            className="mb-5 text-sm font-medium text-white/75 transition hover:text-white"
          >
            ← До моїх результатів
          </button>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/85">
                Аналітика результату
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {analytics.test.title}
              </h1>

              {analytics.test.subject && (
                <p className="mt-2 text-white/70">
                  {analytics.test.subject}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloadingPdf}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#7A1F2B] shadow-lg transition hover:bg-[#faf4f5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloadingPdf
                ? "Формування PDF…"
                : "↓ Завантажити PDF"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* =================================================
            TEST CARD
        ================================================= */}

        <section className="overflow-hidden rounded-[28px] border border-[#eadde0] bg-white shadow-[0_12px_40px_rgba(122,31,43,0.06)]">
          <div className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center md:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#7A1F2B] text-2xl text-white shadow-md shadow-[#7A1F2B]/20">
                ✓
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
                  Тестування
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  {analytics.test.title}
                </h2>

                {analytics.test.subject && (
                  <p className="mt-1 text-sm text-gray-500">
                    {analytics.test.subject}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-[#f7f1f2] px-6 py-4 md:min-w-[150px] md:text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]/70">
                Максимум
              </p>

              <p className="mt-1 text-2xl font-bold text-[#7A1F2B]">
                {formatNumber(
                  analytics.test.maxPoints
                )}
              </p>

              <p className="text-xs text-gray-500">
                балів
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            GENERAL RESULTS
        ================================================= */}

        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
              Статистика тестування
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Загальні результати
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Порівняльна статистика всіх учасників цього тестування
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* MAX */}

            <div className="group rounded-[24px] border border-[#eadde0] bg-white p-6 shadow-[0_8px_30px_rgba(122,31,43,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(122,31,43,0.09)]">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-gray-500">
                  Максимальний результат
                </p>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f1f2] text-[#7A1F2B]">
                  ↑
                </div>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {formatNumber(
                    analytics.groupStatistics
                      .maxScore
                  )}
                </span>

                <span className="text-sm text-gray-500">
                  балів
                </span>
              </div>

              <p className="mt-1 text-sm font-medium text-[#7A1F2B]">
                {formatPercent(
                  maxScorePercent
                )}
              </p>
            </div>

            {/* MIN */}

            <div className="group rounded-[24px] border border-[#eadde0] bg-white p-6 shadow-[0_8px_30px_rgba(122,31,43,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(122,31,43,0.09)]">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-gray-500">
                  Мінімальний результат
                </p>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f1f2] text-[#7A1F2B]">
                  ↓
                </div>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {formatNumber(
                    analytics.groupStatistics
                      .minScore
                  )}
                </span>

                <span className="text-sm text-gray-500">
                  балів
                </span>
              </div>

              <p className="mt-1 text-sm font-medium text-[#7A1F2B]">
                {formatPercent(
                  minScorePercent
                )}
              </p>
            </div>

            {/* AVERAGE */}

            <div className="group rounded-[24px] border border-[#eadde0] bg-white p-6 shadow-[0_8px_30px_rgba(122,31,43,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(122,31,43,0.09)]">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-gray-500">
                  Середній результат
                </p>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f1f2] text-[#7A1F2B]">
                  ≈
                </div>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {formatNumber(
                    analytics.groupStatistics
                      .averageScore
                  )}
                </span>

                <span className="text-sm text-gray-500">
                  балів
                </span>
              </div>

              <p className="mt-1 text-sm font-medium text-[#7A1F2B]">
                {formatPercent(
                  analytics.groupStatistics
                    .averagePercent
                )}
              </p>
            </div>

            {/* PARTICIPANTS */}

            <div className="group rounded-[24px] border border-[#eadde0] bg-white p-6 shadow-[0_8px_30px_rgba(122,31,43,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(122,31,43,0.09)]">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-gray-500">
                  Учасників
                </p>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f1f2] text-[#7A1F2B]">
                  #
                </div>
              </div>

              <div className="mt-5 text-3xl font-bold text-gray-900">
                {analytics.groupStatistics
                  .participants}
              </div>

              <p className="mt-1 text-sm text-gray-500">
                завершених результатів
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            PARTICIPANT RESULT
        ================================================= */}

        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
              Персональна статистика
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Твій результат
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Показники саме цього результату тестування
            </p>
          </div>

          {/* MAIN RESULT */}

          <div className="relative overflow-hidden rounded-[28px] bg-[#7A1F2B] p-7 text-white shadow-[0_18px_45px_rgba(122,31,43,0.22)]">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-28 right-1/4 h-72 w-72 rounded-full bg-black/5" />

            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-white/65">
                  Результат учасника
                </p>

                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-5xl font-black tracking-tight">
                    {formatNumber(
                      participant.earnedPoints
                    )}
                  </span>

                  <span className="text-lg text-white/60">
                    /{" "}
                    {formatNumber(
                      participant.maxPoints
                    )}{" "}
                    балів
                  </span>
                </div>

                <div className="mt-2 text-lg font-semibold text-white/80">
                  {formatPercent(
                    participantPercent
                  )}
                </div>
              </div>

              <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border-8 border-white/15 bg-white/10 md:h-36 md:w-36">
                <span className="text-3xl font-black">
                  {formatPercent(
                    participantPercent
                  )}
                </span>

                <span className="mt-1 text-xs text-white/60">
                  результат
                </span>
              </div>
            </div>
          </div>

          {/* COUNTERS */}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[22px] border border-green-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-500">
                  Правильні
                </p>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 font-bold text-green-600">
                  ✓
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-green-600">
                {participant.correct}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                завдань
              </p>
            </div>

            <div className="rounded-[22px] border border-red-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-500">
                  Неправильні
                </p>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 font-bold text-red-600">
                  ×
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-red-600">
                {participant.incorrect}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                завдань
              </p>
            </div>

            <div className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-500">
                  Не виконано
                </p>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-500">
                  —
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-gray-600">
                {participant.skipped}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                завдань
              </p>
            </div>

            <div className="rounded-[22px] border border-[#eadde0] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-500">
                  Час виконання
                </p>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f7f1f2] text-sm font-bold text-[#7A1F2B]">
                  ◷
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-[#7A1F2B]">
                {formatTime(
                  participant.timeSpent
                )}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                загальний час
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            DIFFICULTY
        ================================================= */}

        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
              Аналіз виконання
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Розподіл складності завдань
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Індивідуальна складність завдань для цього учасника
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                "Дуже складне",
                "Складне",
                "Оптимальне",
                "Легке",
                "Дуже легке",
              ] as Difficulty[]
            ).map((difficulty) => {
              const data =
                getDifficultyData(
                  difficulty
                );

              return (
                <div
                  key={difficulty}
                  className="rounded-[22px] border border-[#eadde0] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${data.dot}`}
                    />

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${data.classes}`}
                    >
                      {data.label}
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-black text-gray-900">
                    {
                      difficultyCounts[
                        difficulty
                      ]
                    }
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {difficultyCounts[
                      difficulty
                    ] === 1
                      ? "завдання"
                      : "завдань"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* =================================================
            QUESTIONS ANALYTICS
        ================================================= */}

        <section>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
                Детальний аналіз
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                Аналітика завдань
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Результати виконання саме цього учасника
              </p>
            </div>

            {detailsAllowed ? (
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Перегляд умов дозволено
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                Перегляд умов обмежено
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[#eadde0] bg-white shadow-[0_12px_40px_rgba(122,31,43,0.06)]">
            {/* TABLE HEADER */}

            <div className="hidden grid-cols-[1fr_130px_150px_130px_80px] gap-4 border-b border-[#eadde0] bg-[#faf7f8] px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 lg:grid">
              <div>Питання</div>

              <div className="text-center">
                Результат
              </div>

              <div className="text-center">
                Нараховано
              </div>

              <div className="text-center">
                Складність
              </div>

              <div />
            </div>

            <div className="divide-y divide-[#eee5e7]">
              {analytics.questions.map(
                (question) => {
                  const difficulty =
                    getDifficultyData(
                      question.difficulty
                    );

                  const status =
                    getStatusData(
                      question.status
                    );

                  const isExpanded =
                    expandedQuestion ===
                    question.id;

                  const canExpand =
                    detailsAllowed;

                  return (
                    <div
                      key={question.id}
                      className={`transition ${
                        isExpanded
                          ? "bg-[#faf7f8]"
                          : "bg-white hover:bg-[#fdfafb]"
                      }`}
                    >
                      {/* QUESTION ROW */}

                      <button
                        type="button"
                        disabled={!canExpand}
                        onClick={() =>
                          toggleQuestion(
                            question
                          )
                        }
                        className={`w-full text-left ${
                          canExpand
                            ? "cursor-pointer"
                            : "cursor-default"
                        }`}
                      >
                        <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_130px_150px_130px_80px] lg:items-center lg:px-6">
                          {/* QUESTION */}

                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7A1F2B] text-sm font-black text-white shadow-sm">
                              {question.order}
                            </div>

                            <div className="min-w-0">
                              <div className="font-bold text-gray-900">
                                Питання №{" "}
                                {question.order}
                              </div>

                              <div className="mt-1 text-xs text-gray-500">
                                {getQuestionTypeLabel(
                                  question.type
                                )}
                              </div>
                            </div>
                          </div>

                          {/* STATUS */}

                          <div className="flex items-center justify-between gap-3 lg:justify-center">
                            <span className="text-xs font-semibold text-gray-500 lg:hidden">
                              Результат
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${status.classes}`}
                            >
                              <span>
                                {status.icon}
                              </span>

                              {
                                status.label
                              }
                            </span>
                          </div>

                          {/* POINTS */}

                          <div className="flex items-center justify-between gap-3 lg:justify-center">
                            <span className="text-xs font-semibold text-gray-500 lg:hidden">
                              Нараховано
                            </span>

                            <div className="text-center">
                              <span
                                className={`text-lg font-black ${
                                  question.earnedPoints >
                                  0
                                    ? "text-[#7A1F2B]"
                                    : "text-gray-600"
                                }`}
                              >
                                {formatNumber(
                                  question.earnedPoints
                                )}
                              </span>

                              <span className="text-sm font-medium text-gray-400">
                                /
                                {formatNumber(
                                  question.points
                                )}
                              </span>

                              <div className="mt-0.5 text-[11px] text-gray-400">
                                балів
                              </div>
                            </div>
                          </div>

                          {/* DIFFICULTY */}

                          <div className="flex items-center justify-between gap-3 lg:justify-center">
                            <span className="text-xs font-semibold text-gray-500 lg:hidden">
                              Складність
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${difficulty.classes}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${difficulty.dot}`}
                              />

                              {
                                difficulty.label
                              }
                            </span>
                          </div>

                          {/* ARROW */}

                          <div className="flex items-center justify-end lg:justify-center">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-2xl leading-none transition ${
                                canExpand
                                  ? "border-[#eadde0] bg-white text-[#7A1F2B] shadow-sm group-hover:border-[#7A1F2B]"
                                  : "border-gray-200 bg-gray-100 text-gray-300"
                              }`}
                              aria-hidden="true"
                            >
                              {isExpanded
                                ? "⌃"
                                : "›"}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* DETAILS */}

                      {isExpanded &&
                        question.details && (
                          <div className="border-t border-[#eadde0] bg-[#f7f1f2] px-5 py-6 lg:px-8">
                            <QuestionDetailsView
                              question={
                                question.details
                              }
                              status={
                                question.status
                              }
                            />
                          </div>
                        )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            DIFFICULTY SCALE
        ================================================= */}

        <section className="rounded-[28px] border border-[#eadde0] bg-white p-6 shadow-[0_12px_40px_rgba(122,31,43,0.05)] md:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7A1F2B] text-white">
              ≋
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Шкала складності
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Індивідуальна складність завдання визначається за результатом його виконання цим учасником.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-5">
            {[
              {
                label: "Дуже складне",
                range: "0–20%",
              },
              {
                label: "Складне",
                range: "21–39%",
              },
              {
                label: "Оптимальне",
                range: "40–59%",
              },
              {
                label: "Легке",
                range: "60–80%",
              },
              {
                label: "Дуже легке",
                range: "81–100%",
              },
            ].map((item) => {
              const data =
                getDifficultyData(
                  item.label
                );

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#eadde0] bg-[#faf7f8] p-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${data.dot}`}
                    />

                    <span className="text-sm font-bold text-gray-800">
                      {item.label}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {item.range}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

// =====================================================
// QUESTION DETAILS VIEW
// =====================================================

function QuestionDetailsView({
  question,
  status,
}: {
  question: QuestionDetails;
  status: QuestionStatus;
}) {
  const options =
    question.options ?? [];

  const statusData =
    getStatusData(status);

  // ===================================================
  // MATCHING
  // ===================================================

  if (question.type === "matching") {
    const {
      left,
      right,
    } = getMatchingParts(options);

    return (
      <div className="space-y-5">
        {/* QUESTION */}

        <div className="rounded-2xl border border-[#eadde0] bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
                Умова питання
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-500">
                {getQuestionTypeLabel(
                  question.type
                )}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusData.classes}`}
            >
              {statusData.icon}{" "}
              {statusData.label}
            </span>
          </div>

          <div className="rounded-xl bg-[#faf7f8] p-4">
            <HtmlContent
              html={question.text}
            />
          </div>
        </div>

        {/* MATCHING */}

        <div className="rounded-2xl border border-[#eadde0] bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-gray-800">
            Встановлення відповідності
          </p>

          <div className="space-y-3">
            {left.map((item) => {
              const rightItem =
                right.find(
                  (rightOption) =>
                    rightOption.id ===
                    item.correctRightId
                );

              return (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2"
                >
                  {/* LEFT */}

                  <div className="rounded-lg bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Елемент
                    </p>

                    <div className="mt-2">
                      <HtmlContent
                        html={item.text}
                      />
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                      Правильна відповідь
                    </p>

                    <div className="mt-2">
                      {rightItem ? (
                        <HtmlContent
                          html={
                            rightItem.text
                          }
                        />
                      ) : (
                        <p className="text-gray-500">
                          Не визначено
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PARTICIPANT ANSWER */}

        <div className="rounded-2xl border border-[#eadde0] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
            Відповідь учасника
          </p>

          <p className="mt-2 font-medium text-gray-800">
            {getParticipantAnswerLabel(
              question
            )}
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // STANDARD
  // ===================================================

  const participantIds =
    getParticipantAnswerIds(
      question.participantAnswer
    );

  return (
    <div className="space-y-5">
      {/* QUESTION */}

      <div className="rounded-2xl border border-[#eadde0] bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
              Умова питання
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-500">
              {getQuestionTypeLabel(
                question.type
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f7f1f2] px-3 py-1.5 text-xs font-bold text-[#7A1F2B]">
              {formatNumber(
                question.points
              )}{" "}
              б.
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusData.classes}`}
            >
              {statusData.icon}{" "}
              {statusData.label}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#faf7f8] p-4">
          <HtmlContent
            html={question.text}
          />
        </div>
      </div>

      {/* OPTIONS */}

      {options.length > 0 && (
        <div className="rounded-2xl border border-[#eadde0] bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-bold text-gray-800">
            Варіанти відповіді
          </p>

          <div className="space-y-2.5">
            {options.map(
              (option, index) => {
                const isSelected =
                  participantIds.includes(
                    option.id
                  );

                return (
                  <div
                    key={option.id}
                    className={`rounded-xl border p-4 transition ${
                      option.isCorrect
                        ? "border-green-300 bg-green-50"
                        : isSelected
                        ? "border-[#d8aeb5] bg-[#fff8f9]"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          option.isCorrect
                            ? "bg-green-600 text-white"
                            : isSelected
                            ? "bg-[#7A1F2B] text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {String.fromCharCode(
                          65 + index
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <HtmlContent
                          html={
                            option.text
                          }
                        />
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {option.isCorrect && (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                            Правильна
                          </span>
                        )}

                        {isSelected && (
                          <span className="rounded-full bg-[#f7f1f2] px-2.5 py-1 text-[11px] font-bold text-[#7A1F2B]">
                            Ваша відповідь
                          </span>
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

      {/* PARTICIPANT ANSWER */}

      <div className="rounded-2xl border border-[#eadde0] bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
          Відповідь учасника
        </p>

        <p className="mt-2 font-medium text-gray-800">
          {getParticipantAnswerLabel(
            question
          )}
        </p>
      </div>
    </div>
  );
}