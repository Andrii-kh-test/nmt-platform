"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type AnswerOption = {
  id: number;
  order: number;
  text: string;
  isCorrect: boolean;
};

type QuestionStatistic = {
  id: number;
  order: number;
  text: string;
  type: string;
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

  options?: AnswerOption[];
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

function getQuestionTypeLabel(type: string) {
  switch (type) {
    case "single":
      return "Одна правильна відповідь";

    case "multiple":
      return "Кілька правильних відповідей";

    case "matching":
      return "Встановлення відповідності";

    case "text":
      return "Відкрита відповідь";

    default:
      return type || "Завдання";
  }
}

function getPercentColor(percent: number) {
  if (percent >= 80) {
    return "text-green-600";
  }

  if (percent >= 60) {
    return "text-green-500";
  }

  if (percent >= 40) {
    return "text-yellow-600";
  }

  if (percent >= 21) {
    return "text-orange-600";
  }

  return "text-red-600";
}

function cleanMatchingText(text: string) {
  if (!text) {
    return "";
  }

  if (text.startsWith("L|")) {
    const parts = text.split("|");
    return parts[2] ?? text;
  }

  if (text.startsWith("R|")) {
    const parts = text.split("|");
    return parts[2] ?? text;
  }

  return text;
}

function isMatchingLeft(text: string) {
  return text.startsWith("L|");
}

function isMatchingRight(text: string) {
  return text.startsWith("R|");
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();

  const testId = params?.id;

  const [data, setData] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [expandedQuestions, setExpandedQuestions] =
    useState<Set<number>>(
      new Set()
    );

  const [showParticipants, setShowParticipants] =
    useState(false);

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    if (!testId) {
      return;
    }

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/analytics?testId=${testId}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Не вдалося завантажити аналітику."
          );
        }

        setData(result);
      } catch (err) {
        console.error(
          "ANALYTICS PAGE ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося завантажити аналітику."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [testId]);

  const filteredQuestions = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return data.questions;
    }

    return data.questions.filter(
      (question) =>
        question.text
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(question.order).includes(
          normalizedSearch
        )
    );
  }, [data, search]);

  function toggleQuestion(
    questionId: number
  ) {
    setExpandedQuestions((previous) => {
      const next = new Set(previous);

      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }

      return next;
    });
  }

  function expandAll() {
    if (!data) {
      return;
    }

    setExpandedQuestions(
      new Set(
        data.questions.map(
          (question) => question.id
        )
      )
    );
  }

  function collapseAll() {
    setExpandedQuestions(new Set());
  }

  if (loading) {
    return (
      <div className="min-h-[500px]">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

            <p className="text-lg text-gray-600">
              Завантаження аналітики...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold text-[#7A1F2B]">
              Аналітика
            </h2>

            <p className="mt-2 text-gray-600">
              Аналіз результатів тестування
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg bg-[#7A1F2B] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#641923] hover:shadow-md"
          >
            ← Повернутися до адміністративної панелі
          </Link>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-xl font-bold text-red-700">
            Помилка
          </h3>

          <p className="mt-2 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.refresh()
            }
            className="mt-5 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700"
          >
            Спробувати ще раз
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-lg text-gray-600">
          Дані аналітики відсутні.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* =====================================================
          ЗАГОЛОВОК
      ===================================================== */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-lg bg-[#F3E8EA] px-3 py-1.5 text-sm font-semibold text-[#7A1F2B]">
              Аналітика
            </span>

            <span className="text-sm text-gray-500">
              Тест №{data.test.id}
            </span>
          </div>

          <h2 className="text-4xl font-bold text-[#7A1F2B]">
            {data.test.title}
          </h2>

          {data.test.subject && (
            <p className="mt-2 text-lg text-gray-600">
              Предмет:{" "}
              <span className="font-semibold">
                {data.test.subject}
              </span>
            </p>
          )}
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg bg-[#7A1F2B] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#641923] hover:shadow-md"
        >
          ← Повернутися до адміністративної панелі
        </Link>
      </div>

      {/* =====================================================
          ЗАГАЛЬНА СТАТИСТИКА
      ===================================================== */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Учасників
          </p>

          <p className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {data.summary.participants}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Середній результат
          </p>

          <p
            className={`mt-2 text-3xl font-bold ${getPercentColor(
              data.summary.averagePercent
            )}`}
          >
            {data.summary.averagePercent}%
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Середній бал
          </p>

          <p className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {data.summary.averageScore}
          </p>

          <p className="mt-1 text-sm text-gray-400">
            із {data.test.maxPoints}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Найкращий результат
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {data.summary.maxScore}
          </p>

          <p className="mt-1 text-sm text-gray-400">
            балів
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Найнижчий результат
          </p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {data.summary.minScore}
          </p>

          <p className="mt-1 text-sm text-gray-400">
            балів
          </p>
        </div>
      </div>

      {/* =====================================================
          УЧАСНИКИ
      ===================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() =>
            setShowParticipants(
              (previous) => !previous
            )
          }
          className="flex w-full items-center justify-between px-6 py-5 text-left"
        >
          <div>
            <h3 className="text-xl font-bold text-[#7A1F2B]">
              Результати учасників
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Натисніть, щоб переглянути список
              учасників
            </p>
          </div>

          <span className="text-2xl text-[#7A1F2B]">
            {showParticipants ? "−" : "+"}
          </span>
        </button>

        {showParticipants && (
          <div className="border-t border-gray-200">
            {data.participants.length ===
            0 ? (
              <div className="p-6 text-center text-gray-500">
                Учасників ще немає.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        №
                      </th>

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
                    {data.participants.map(
                      (
                        participant,
                        index
                      ) => (
                        <tr
                          key={
                            participant.id
                          }
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 text-gray-500">
                            {index + 1}
                          </td>

                          <td className="px-6 py-4 font-medium text-gray-800">
                            {
                              participant.name
                            }
                          </td>

                          <td className="px-6 py-4 text-center font-semibold text-gray-700">
                            {
                              participant.earnedPoints
                            }
                          </td>

                          <td
                            className={`px-6 py-4 text-center font-bold ${getPercentColor(
                              participant.percent
                            )}`}
                          >
                            {
                              participant.percent
                            }
                            %
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          ЗАГОЛОВОК СТАТИСТИКИ ПИТАНЬ
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#7A1F2B]">
            Аналіз завдань
          </h3>

          <p className="mt-1 text-gray-600">
            Натисніть на завдання, щоб переглянути
            його повний зміст та варіанти відповідей.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Пошук завдання..."
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#7A1F2B] focus:ring-2 focus:ring-[#7A1F2B]/10"
          />

          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border border-[#7A1F2B] bg-white px-4 py-2.5 text-sm font-semibold text-[#7A1F2B] transition hover:bg-[#F3E8EA]"
          >
            Розгорнути всі
          </button>

          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Згорнути всі
          </button>
        </div>
      </div>

      {/* =====================================================
          ТАБЛИЦЯ ЗАВДАНЬ
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-[#F8F5F6]">
              <tr>
                <th className="w-16 px-4 py-4 text-center text-sm font-bold text-gray-600">
                  №
                </th>

                <th className="px-5 py-4 text-left text-sm font-bold text-gray-600">
                  Завдання
                </th>

                <th className="w-32 px-4 py-4 text-center text-sm font-bold text-gray-600">
                  Правильно
                </th>

                <th className="w-32 px-4 py-4 text-center text-sm font-bold text-gray-600">
                  Неправильно
                </th>

                <th className="w-32 px-4 py-4 text-center text-sm font-bold text-gray-600">
                  Пропущено
                </th>

                <th className="w-32 px-4 py-4 text-center text-sm font-bold text-gray-600">
                  Складність
                </th>

                <th className="w-16 px-4 py-4" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredQuestions.map(
                (question) => {
                  const expanded =
                    expandedQuestions.has(
                      question.id
                    );

                  return (
                    <QuestionRow
                      key={question.id}
                      question={question}
                      expanded={expanded}
                      onToggle={() =>
                        toggleQuestion(
                          question.id
                        )
                      }
                    />
                  );
                }
              )}
            </tbody>
          </table>
        </div>

        {filteredQuestions.length ===
          0 && (
          <div className="p-10 text-center text-gray-500">
            За вашим запитом завдань не знайдено.
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   РЯДОК ПИТАННЯ
========================================================= */

function QuestionRow({
  question,
  expanded,
  onToggle,
}: {
  question: QuestionStatistic;
  expanded: boolean;
  onToggle: () => void;
}) {
  const options =
    question.options ?? [];

  const matchingLeft =
    options.filter((option) =>
      isMatchingLeft(option.text)
    );

  const matchingRight =
    options.filter((option) =>
      isMatchingRight(option.text)
    );

  return (
    <>
      {/* -----------------------------------------------------
          ОСНОВНИЙ РЯДОК
      ----------------------------------------------------- */}

      <tr
        onClick={onToggle}
        className={`cursor-pointer transition ${
          expanded
            ? "bg-[#F3E8EA]"
            : "hover:bg-gray-50"
        }`}
      >
        <td className="px-4 py-5 text-center">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#7A1F2B] font-bold text-white">
            {question.order}
          </div>
        </td>

        <td className="px-5 py-5">
          <div className="max-w-[600px]">
            <p className="line-clamp-2 font-semibold text-gray-800">
              {question.text}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {getQuestionTypeLabel(
                  question.type
                )}
              </span>

              <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {question.points}{" "}
                {question.points === 1
                  ? "бал"
                  : "бали"}
              </span>
            </div>
          </div>
        </td>

        <td className="px-4 py-5 text-center">
          <div className="font-bold text-green-600">
            {question.correct}
          </div>

          <div className="text-xs text-green-600">
            {question.correctPercent}%
          </div>
        </td>

        <td className="px-4 py-5 text-center">
          <div className="font-bold text-red-600">
            {question.incorrect}
          </div>

          <div className="text-xs text-red-600">
            {question.incorrectPercent}%
          </div>
        </td>

        <td className="px-4 py-5 text-center">
          <div className="font-bold text-gray-500">
            {question.skipped}
          </div>

          <div className="text-xs text-gray-500">
            {question.skippedPercent}%
          </div>
        </td>

        <td className="px-4 py-5 text-center">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getDifficultyClasses(
              question.difficulty.color
            )}`}
          >
            {question.difficulty.label}
          </span>
        </td>

        <td className="px-4 py-5 text-center">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-[#7A1F2B] shadow-sm transition ${
              expanded
                ? "rotate-180"
                : ""
            }`}
          >
            ↓
          </span>
        </td>
      </tr>

      {/* -----------------------------------------------------
          РОЗГОРНУТИЙ БЛОК
      ----------------------------------------------------- */}

      {expanded && (
        <tr>
          <td
            colSpan={7}
            className="bg-gray-50 px-6 py-6"
          >
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Заголовок */}

              <div className="border-b border-gray-200 px-6 py-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-[#7A1F2B] px-3 py-1.5 text-sm font-bold text-white">
                    Завдання{" "}
                    {question.order}
                  </span>

                  <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
                    ID: {question.id}
                  </span>

                  <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
                    {getQuestionTypeLabel(
                      question.type
                    )}
                  </span>

                  <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
                    {question.points}{" "}
                    {question.points === 1
                      ? "бал"
                      : "бали"}
                  </span>
                </div>
              </div>

              {/* Умова */}

              <div className="px-6 py-6">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                  Умова завдання
                </h4>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <p className="whitespace-pre-wrap text-lg leading-8 text-gray-800">
                    {question.text}
                  </p>
                </div>
              </div>

              {/* Варіанти */}

              <div className="px-6 pb-6">
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
                  {question.type ===
                  "matching"
                    ? "Елементи завдання"
                    : "Варіанти відповідей"}
                </h4>

                {options.length ===
                0 ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 text-yellow-800">
                    Варіанти відповідей не
                    передані API.
                  </div>
                ) : question.type ===
                  "matching" ? (
                  <MatchingOptions
                    leftItems={
                      matchingLeft
                    }
                    rightItems={
                      matchingRight
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {options
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
                            className={`flex items-start gap-4 rounded-lg border p-4 ${
                              option.isCorrect
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
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

                            <div className="flex-1 pt-1">
                              <p
                                className={`whitespace-pre-wrap leading-6 ${
                                  option.isCorrect
                                    ? "font-semibold text-green-800"
                                    : "text-gray-700"
                                }`}
                              >
                                {
                                  option.text
                                }
                              </p>
                            </div>

                            {option.isCorrect && (
                              <span className="shrink-0 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                                ✓ Правильна
                              </span>
                            )}
                          </div>
                        )
                      )}
                  </div>
                )}
              </div>

              {/* Статистика */}

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-6">
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
                  Статистика завдання
                </h4>

                <div className="grid gap-4 sm:grid-cols-3">
                  <StatisticCard
                    title="Правильні відповіді"
                    count={
                      question.correct
                    }
                    percent={
                      question.correctPercent
                    }
                    type="correct"
                  />

                  <StatisticCard
                    title="Неправильні відповіді"
                    count={
                      question.incorrect
                    }
                    percent={
                      question.incorrectPercent
                    }
                    type="incorrect"
                  />

                  <StatisticCard
                    title="Пропущені"
                    count={
                      question.skipped
                    }
                    percent={
                      question.skippedPercent
                    }
                    type="skipped"
                  />
                </div>

                {/* Шкала */}

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-gray-600">
                      Розподіл відповідей
                    </span>

                    <span className="text-gray-500">
                      Учасників:{" "}
                      {question.correct +
                        question.incorrect +
                        question.skipped}
                    </span>
                  </div>

                  <div className="flex h-4 overflow-hidden rounded-full bg-gray-200">
                    {question.correctPercent >
                      0 && (
                      <div
                        className="bg-green-500 transition-all"
                        style={{
                          width: `${question.correctPercent}%`,
                        }}
                        title={`Правильно: ${question.correctPercent}%`}
                      />
                    )}

                    {question.incorrectPercent >
                      0 && (
                      <div
                        className="bg-red-500 transition-all"
                        style={{
                          width: `${question.incorrectPercent}%`,
                        }}
                        title={`Неправильно: ${question.incorrectPercent}%`}
                      />
                    )}

                    {question.skippedPercent >
                      0 && (
                      <div
                        className="bg-gray-400 transition-all"
                        style={{
                          width: `${question.skippedPercent}%`,
                        }}
                        title={`Пропущено: ${question.skippedPercent}%`}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* =========================================================
   СТАТИСТИКА
========================================================= */

function StatisticCard({
  title,
  count,
  percent,
  type,
}: {
  title: string;
  count: number;
  percent: number;
  type:
    | "correct"
    | "incorrect"
    | "skipped";
}) {
  const classes = {
    correct:
      "border-green-200 bg-green-50 text-green-700",
    incorrect:
      "border-red-200 bg-red-50 text-red-700",
    skipped:
      "border-gray-200 bg-gray-100 text-gray-600",
  };

  return (
    <div
      className={`rounded-lg border p-5 ${classes[type]}`}
    >
      <p className="text-sm font-semibold">
        {title}
      </p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-3xl font-bold">
          {count}
        </span>

        <span className="text-xl font-bold">
          {percent}%
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   MATCHING
========================================================= */

function MatchingOptions({
  leftItems,
  rightItems,
}: {
  leftItems: AnswerOption[];
  rightItems: AnswerOption[];
}) {
  if (
    leftItems.length === 0 &&
    rightItems.length === 0
  ) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 text-yellow-800">
        Дані для встановлення відповідності
        відсутні.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h5 className="mb-3 font-bold text-[#7A1F2B]">
          Ліва частина
        </h5>

        <div className="space-y-3">
          {leftItems.map(
            (option, index) => (
              <div
                key={option.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3E8EA] text-sm font-bold text-[#7A1F2B]">
                    {index + 1}
                  </span>

                  <p className="whitespace-pre-wrap pt-1 text-gray-700">
                    {cleanMatchingText(
                      option.text
                    )}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div>
        <h5 className="mb-3 font-bold text-[#7A1F2B]">
          Права частина
        </h5>

        <div className="space-y-3">
          {rightItems.map(
            (option, index) => (
              <div
                key={option.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                    {index + 1}
                  </span>

                  <p className="whitespace-pre-wrap pt-1 text-gray-700">
                    {cleanMatchingText(
                      option.text
                    )}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}