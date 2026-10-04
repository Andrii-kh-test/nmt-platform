"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Clock3,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type SummaryData = {
  totalTests: number;
  minPercent: number | null;
  maxPercent: number | null;
  averagePercent: number | null;
  averagePoints: number | null;
  averageTime: number | null;
  dynamics: {
    value: number | null;
    direction: "up" | "down" | "neutral";
  };
};

function formatPercent(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${value.toLocaleString("uk-UA", {
    maximumFractionDigits: 1,
  })}%`;
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "—";
  }

  return value.toLocaleString("uk-UA", {
    maximumFractionDigits: 1,
  });
}

function formatTime(seconds: number | null) {
  if (seconds === null) {
    return "—";
  }

  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} хв`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} год`;
  }

  return `${hours} год ${minutes} хв`;
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

function getDynamicsText(
  value: number | null,
  direction: "up" | "down" | "neutral"
) {
  if (value === null) {
    return "—";
  }

  const formattedValue = Math.abs(value).toLocaleString(
    "uk-UA",
    {
      maximumFractionDigits: 1,
    }
  );

  if (direction === "up") {
    return `+${formattedValue} в.п.`;
  }

  if (direction === "down") {
    return `−${formattedValue} в.п.`;
  }

  return `${formattedValue} в.п.`;
}

export default function ParticipantAnalyticsSummary() {
  const [data, setData] =
    useState<SummaryData | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await fetch(
          "/api/participant/analytics/summary",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Не вдалося завантажити загальну аналітику."
          );
        }

        const result =
          await response.json();

        setData(result);
      } catch (error) {
        console.error(
          "Participant analytics summary error:",
          error
        );

        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="mb-2 h-3 w-32 animate-pulse rounded bg-gray-200" />

            <div className="h-7 w-56 animate-pulse rounded bg-gray-200" />

            <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-gray-100" />
          </div>

          <div className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-gray-100" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                key={index}
                className="min-h-[154px] animate-pulse rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-gray-200" />
                  <div className="h-3 w-6 rounded bg-gray-200" />
                </div>

                <div className="mt-5 h-3 w-28 rounded bg-gray-200" />

                <div className="mt-3 h-8 w-20 rounded bg-gray-200" />

                <div className="mt-3 h-3 w-full rounded bg-gray-100" />
              </div>
            )
          )}
        </div>
      </section>
    );
  }

  if (!data || data.totalTests === 0) {
    return null;
  }

  const dynamicsValue =
    data.dynamics.value;

  const dynamicsDirection =
    data.dynamics.direction;

  const DynamicsIcon =
    dynamicsDirection === "up"
      ? TrendingUp
      : dynamicsDirection === "down"
      ? TrendingDown
      : Activity;

  const dynamicsText = getDynamicsText(
    dynamicsValue,
    dynamicsDirection
  );

  const dynamicsIconClass =
    dynamicsDirection === "up"
      ? "bg-green-50 text-green-700"
      : dynamicsDirection === "down"
      ? "bg-red-50 text-red-700"
      : "bg-[#F3E8EA] text-[#7A1F2B]";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#7A1F2B]">
            ВАША СТАТИСТИКА
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            Загальна аналітика
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Основні показники за всіма завершеними
            тестами
          </p>
        </div>

        <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#7A1F2B]/15 bg-[#F3E8EA] px-3.5 py-2 text-sm font-semibold text-[#7A1F2B]">
          <BarChart3
            size={17}
            strokeWidth={1.8}
          />

          <span>
            {data.totalTests}{" "}
            {getTestsLabel(data.totalTests)}
          </span>
        </div>
      </div>

      {/* =====================================================
          METRICS
      ===================================================== */}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* ===================================================
            01 — MIN
        =================================================== */}

        <div className="group min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#7A1F2B]/20 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8EA] text-[#7A1F2B]">
              <TrendingDown
                size={19}
                strokeWidth={1.7}
              />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-gray-300">
              01
            </span>
          </div>

          <div className="mt-4 text-xs font-semibold leading-4 text-gray-500">
            Мінімальний результат
          </div>

          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {formatPercent(data.minPercent)}
          </div>

          <div className="mt-1 text-[11px] leading-4 text-gray-400">
            найнижча успішність
          </div>
        </div>

        {/* ===================================================
            02 — MAX
        =================================================== */}

        <div className="group min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#7A1F2B]/20 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8EA] text-[#7A1F2B]">
              <TrendingUp
                size={19}
                strokeWidth={1.7}
              />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-gray-300">
              02
            </span>
          </div>

          <div className="mt-4 text-xs font-semibold leading-4 text-gray-500">
            Максимальний результат
          </div>

          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {formatPercent(data.maxPercent)}
          </div>

          <div className="mt-1 text-[11px] leading-4 text-gray-400">
            найкращий результат
          </div>
        </div>

        {/* ===================================================
            03 — AVERAGE
        =================================================== */}

        <div className="group min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#7A1F2B]/20 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8EA] text-[#7A1F2B]">
              <Target
                size={19}
                strokeWidth={1.7}
              />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-gray-300">
              03
            </span>
          </div>

          <div className="mt-4 text-xs font-semibold leading-4 text-gray-500">
            Середній бал
          </div>

          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {formatNumber(data.averagePoints)}
          </div>

          <div className="mt-1 text-[11px] leading-4 text-gray-400">
            середня успішність{" "}
            {formatPercent(data.averagePercent)}
          </div>
        </div>

        {/* ===================================================
            04 — SUCCESS
        =================================================== */}

        <div className="group min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#7A1F2B]/20 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8EA] text-[#7A1F2B]">
              <Percent
                size={19}
                strokeWidth={1.7}
              />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-gray-300">
              04
            </span>
          </div>

          <div className="mt-4 text-xs font-semibold leading-4 text-gray-500">
            Успішність
          </div>

          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {formatPercent(data.averagePercent)}
          </div>

          <div className="mt-1 text-[11px] leading-4 text-gray-400">
            середній відсоток виконання
          </div>
        </div>

        {/* ===================================================
            05 — TIME
        =================================================== */}

        <div className="group min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#7A1F2B]/20 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8EA] text-[#7A1F2B]">
              <Clock3
                size={19}
                strokeWidth={1.7}
              />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-gray-300">
              05
            </span>
          </div>

          <div className="mt-4 text-xs font-semibold leading-4 text-gray-500">
            Середній час
          </div>

          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {formatTime(data.averageTime)}
          </div>

          <div className="mt-1 text-[11px] leading-4 text-gray-400">
            середня тривалість тестування
          </div>
        </div>

        {/* ===================================================
            06 — DYNAMICS
        =================================================== */}

        <div className="group min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#7A1F2B]/20 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${dynamicsIconClass}`}
            >
              <DynamicsIcon
                size={19}
                strokeWidth={1.7}
              />
            </div>

            <span className="text-[11px] font-bold tracking-wider text-gray-300">
              06
            </span>
          </div>

          <div className="mt-4 text-xs font-semibold leading-4 text-gray-500">
            Динаміка
          </div>

          <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {dynamicsText}
          </div>

          <div className="mt-1 text-[11px] leading-4 text-gray-400">
            {dynamicsValue === null
              ? "потрібно щонайменше 2 тести"
              : "порівняно з попереднім тестом"}
          </div>
        </div>
      </div>
    </section>
  );
}