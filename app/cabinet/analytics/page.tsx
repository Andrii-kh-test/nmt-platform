import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth/session";
import ParticipantAnalyticsSummary from "@/app/components/cabinet/ParticipantAnalyticsSummary";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getTestsLabel(count: number) {
  if (count === 1) {
    return "тест";
  }

  if (count >= 2 && count <= 4) {
    return "тести";
  }

  return "тестів";
}

/**
 * Динаміка результату щодо попереднього тестування.
 *
 * Порівнюємо саме відсоток виконання,
 * оскільки різні тести можуть мати
 * різну максимальну кількість балів.
 */
function getResultDynamics(
  currentPercent: number,
  previousPercent: number | null
) {
  if (previousPercent === null) {
    return {
      type: "first" as const,
      value: null,
    };
  }

  const difference =
    currentPercent - previousPercent;

  if (difference > 0) {
    return {
      type: "up" as const,
      value: difference,
    };
  }

  if (difference < 0) {
    return {
      type: "down" as const,
      value: Math.abs(difference),
    };
  }

  return {
    type: "same" as const,
    value: 0,
  };
}

function formatDynamicsValue(value: number) {
  return value.toLocaleString("uk-UA", {
    maximumFractionDigits: 1,
  });
}

function DynamicsBadge({
  currentPercent,
  previousPercent,
}: {
  currentPercent: number;
  previousPercent: number | null;
}) {
  const dynamics = getResultDynamics(
    currentPercent,
    previousPercent
  );

  /* =========================================================
     FIRST RESULT
  ========================================================= */

  if (dynamics.type === "first") {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-[#7A1F2B]/10 bg-[#F3E8EA] px-3 py-2 text-xs font-semibold text-[#7A1F2B]">
        <Activity
          size={15}
          strokeWidth={1.8}
        />

        <span>Перший результат</span>
      </div>
    );
  }

  /* =========================================================
     UP
  ========================================================= */

  if (dynamics.type === "up") {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
        <TrendingUp
          size={15}
          strokeWidth={1.9}
        />

        <span>
          +{formatDynamicsValue(dynamics.value)} в.п.
        </span>

        <span className="font-medium text-green-600">
          до попереднього
        </span>
      </div>
    );
  }

  /* =========================================================
     DOWN
  ========================================================= */

  if (dynamics.type === "down") {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
        <TrendingDown
          size={15}
          strokeWidth={1.9}
        />

        <span>
          −{formatDynamicsValue(dynamics.value)} в.п.
        </span>

        <span className="font-medium text-red-600">
          до попереднього
        </span>
      </div>
    );
  }

  /* =========================================================
     SAME
  ========================================================= */

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600">
      <Minus
        size={15}
        strokeWidth={1.9}
      />

      <span>0 в.п.</span>

      <span className="font-medium text-gray-500">
        без змін
      </span>
    </div>
  );
}

export default async function ParticipantAnalyticsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const results = await prisma.testResult.findMany({
    where: {
      session: {
        participant: {
          userId: user.id,
        },
      },
    },

    include: {
      test: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-full">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3E8EA] text-[#7A1F2B]">
          <BarChart3
            size={25}
            strokeWidth={1.7}
          />
        </div>

        <h1 className="text-3xl font-bold text-[#7A1F2B]">
          Аналітика
        </h1>

        <p className="mt-2 text-gray-500">
          Аналіз ваших результатів та прогресу
          у виконанні тестів
        </p>
      </div>

      {/* =====================================================
          OVERALL ANALYTICS
      ===================================================== */}

      <ParticipantAnalyticsSummary />

      {/* =====================================================
          DETAILED ANALYTICS
      ===================================================== */}

      <section className="mt-8">
        {/* ===================================================
            SECTION HEADER
        =================================================== */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#7A1F2B]">
              ДЕТАЛЬНА АНАЛІТИКА
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Результати тестування
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Оберіть тест, щоб переглянути
              детальний аналіз результату
            </p>
          </div>

          <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#7A1F2B] shadow-sm">
            <ClipboardCheck
              size={17}
              strokeWidth={1.8}
            />

            <span>
              {results.length}{" "}
              {getTestsLabel(results.length)}
            </span>
          </div>
        </div>

        {/* ===================================================
            EMPTY STATE
        =================================================== */}

        {results.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3E8EA] text-[#7A1F2B]">
                <FileText
                  size={29}
                  strokeWidth={1.6}
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-800">
                Ви ще не проходили тестів
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                Після завершення тестування
                результати та аналітика
                з&apos;являться тут.
              </p>
            </div>
          </div>
        ) : (
          /* =================================================
             RESULT LIST
          ================================================= */

          <div className="space-y-3">
            {results.map((result, index) => {
              /*
               * Результати відсортовані від найновішого
               * до найстарішого.
               *
               * Тому results[index + 1] —
               * попередній результат у часовій послідовності.
               */

              const previousResult =
                results[index + 1] ?? null;

              const dynamics =
                getResultDynamics(
                  result.percent,
                  previousResult?.percent ?? null
                );

              return (
                <Link
                  key={result.id}
                  href={`/cabinet/analytics/${result.id}`}
                  className="group relative block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7A1F2B]/25 hover:shadow-md"
                >
                  {/* =================================================
                      BORDEAUX ACCENT
                  ================================================= */}

                  <div className="absolute inset-y-0 left-0 w-1 bg-[#7A1F2B]" />

                  <div className="flex min-h-[104px] items-center gap-5 px-5 py-4 pl-6">
                    {/* =================================================
                        ICON
                    ================================================= */}

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F3E8EA] text-[#7A1F2B] transition-all duration-200 group-hover:bg-[#7A1F2B] group-hover:text-white">
                      <BookOpen
                        size={22}
                        strokeWidth={1.7}
                      />
                    </div>

                    {/* =================================================
                        TEST INFORMATION
                    ================================================= */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <h3 className="min-w-0 flex-1 line-clamp-2 text-base font-bold leading-5 text-gray-800 transition-colors group-hover:text-[#7A1F2B]">
                          {result.test.title}
                        </h3>

                        {/* EXAM TYPE */}

                        <span className="hidden shrink-0 rounded-lg border border-[#7A1F2B]/10 bg-[#F3E8EA] px-2.5 py-1 text-[11px] font-bold text-[#7A1F2B] sm:inline-flex">
                          {result.test.examType}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                        <span>
                          {result.test.subject}
                        </span>

                        <span className="text-gray-300">
                          •
                        </span>

                        <span>
                          {result.test.examType}
                        </span>

                        <span className="text-gray-300">
                          •
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <CalendarDays
                            size={13}
                            strokeWidth={1.7}
                          />

                          {formatDate(
                            result.createdAt
                          )}
                        </span>
                      </div>
                    </div>

                    {/* =================================================
                        SCORE
                    ================================================= */}

                    <div className="hidden shrink-0 text-right md:block">
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                        Результат
                      </div>

                      <div className="mt-0.5 flex items-baseline justify-end gap-0.5">
                        <span className="text-2xl font-bold text-[#7A1F2B]">
                          {result.percent}
                        </span>

                        <span className="text-sm font-semibold text-[#7A1F2B]">
                          %
                        </span>
                      </div>

                      <div className="mt-0.5 text-xs text-gray-500">
                        {result.earnedPoints} /{" "}
                        {result.maxPoints} балів
                      </div>
                    </div>

                    {/* =================================================
                        DYNAMICS
                    ================================================= */}

                    <div className="hidden shrink-0 lg:block">
                      <DynamicsBadge
                        currentPercent={
                          result.percent
                        }
                        previousPercent={
                          previousResult?.percent ??
                          null
                        }
                      />
                    </div>

                    {/* =================================================
                        ARROW
                    ================================================= */}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8EA] text-[#7A1F2B] transition-all duration-200 group-hover:bg-[#7A1F2B] group-hover:text-white">
                      <ChevronRight
                        size={20}
                        strokeWidth={1.8}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>

                  {/* =================================================
                      MOBILE / TABLET FOOTER
                  ================================================= */}

                  <div className="border-t border-gray-100 px-5 py-3 md:hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                          Результат
                        </span>

                        <div className="mt-0.5 flex items-baseline gap-1">
                          <span className="text-xl font-bold text-[#7A1F2B]">
                            {result.percent}%
                          </span>

                          <span className="text-xs text-gray-500">
                            {result.earnedPoints} /{" "}
                            {result.maxPoints} балів
                          </span>
                        </div>
                      </div>

                      <DynamicsBadge
                        currentPercent={
                          result.percent
                        }
                        previousPercent={
                          previousResult?.percent ??
                          null
                        }
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}