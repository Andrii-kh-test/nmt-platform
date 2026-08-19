"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// =====================================================
// TYPES
// =====================================================

type Test = {
  id: number;
  title: string;
  subject: string;
  examType: string;
};

type Participant = {
  id: number;
  name: string;
  earnedPoints: number;
  percent: number;
};

type Difficulty = {
  label: string;
  color: string;
};

type QuestionStatistic = {
  id: number;
  order: number;
  text: string;
  points: number;

  correct: number;
  incorrect: number;
  skipped: number;

  correctPercent: number;
  incorrectPercent: number;
  skippedPercent: number;

  difficulty: Difficulty;
};

type AnalyticsData = {
  test: {
    id: number;
    title: string;
    subject: string;
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

// =====================================================
// DIFFICULTY
// =====================================================

function getDifficultyClasses(
  color: string
) {
  switch (color) {
    case "green":
      return "bg-green-100 text-green-800";

    case "yellow":
      return "bg-yellow-100 text-yellow-800";

    case "orange":
      return "bg-orange-100 text-orange-800";

    case "red":
      return "bg-red-100 text-red-800";

    default:
      return "bg-gray-100 text-gray-800";
  }
}

// =====================================================
// PAGE
// =====================================================

export default function AdminAnalyticsPage() {
  const [tests, setTests] = useState<Test[]>([]);

  const [selectedTestId, setSelectedTestId] =
    useState("");

  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);

  // ===================================================
  // Вибрані учасники
  // ===================================================

  const [
    selectedParticipants,
    setSelectedParticipants,
  ] = useState<number[]>([]);

  const [
    useAllParticipants,
    setUseAllParticipants,
  ] = useState(true);

  // ===================================================
  // Розгорнуті питання
  // ===================================================

  const [
    expandedQuestions,
    setExpandedQuestions,
  ] = useState<number[]>([]);

  // ===================================================
  // Loading / errors
  // ===================================================

  const [loadingTests, setLoadingTests] =
    useState(true);

  const [
    loadingAnalytics,
    setLoadingAnalytics,
  ] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // Завантаження тестів
  // =====================================================

  useEffect(() => {
    async function loadTests() {
      try {
        setLoadingTests(true);
        setError("");

        const response = await fetch(
          "/api/tests"
        );

        if (!response.ok) {
          throw new Error(
            "Не вдалося отримати список тестів."
          );
        }

        const data = await response.json();

        const normalizedTests: Test[] =
          Array.isArray(data)
            ? data
                .filter(
                  (test: any) =>
                    test &&
                    Number.isInteger(
                      Number(test.id)
                    )
                )
                .map((test: any) => ({
                  id: Number(test.id),

                  title:
                    test.title ?? "Без назви",

                  subject:
                    test.subject ?? "",

                  examType:
                    test.examType ?? "",
                }))
            : [];

        setTests(normalizedTests);
      } catch (err) {
        console.error(
          "LOAD TESTS ERROR:",
          err
        );

        setError(
          "Не вдалося завантажити список тестів."
        );
      } finally {
        setLoadingTests(false);
      }
    }

    loadTests();
  }, []);

  // =====================================================
  // Завантаження аналітики
  // =====================================================

  async function loadAnalytics(
    testId: number,
    participantIds?: number[]
  ) {
    try {
      setLoadingAnalytics(true);
      setError("");

      let url =
        `/api/analytics?testId=${encodeURIComponent(
          testId
        )}`;

      // Якщо передано конкретних учасників
      if (
        participantIds &&
        participantIds.length > 0
      ) {
        url +=
          `&participants=${encodeURIComponent(
            JSON.stringify(
              participantIds
            )
          )}`;
      }

      const response = await fetch(url, {
        cache: "no-store",
      });

      if (!response.ok) {
        const message =
          await response.text();

        console.error(
          "ANALYTICS RESPONSE:",
          message
        );

        throw new Error(
          "Не вдалося завантажити аналітику."
        );
      }

      const data =
        (await response.json()) as AnalyticsData;

      setAnalytics(data);

      // Якщо режим "усі учасники",
      // синхронізуємо чекбокси з отриманими
      // результатами.
      if (useAllParticipants) {
        setSelectedParticipants(
          data.participants.map(
            (participant) =>
              participant.id
          )
        );
      }
    } catch (err) {
      console.error(
        "LOAD ANALYTICS ERROR:",
        err
      );

      setAnalytics(null);

      setError(
        "Не вдалося сформувати аналітику."
      );
    } finally {
      setLoadingAnalytics(false);
    }
  }

  // =====================================================
  // Вибір тесту
  // =====================================================

  function handleTestChange(
    value: string
  ) {
    setSelectedTestId(value);

    setAnalytics(null);

    setSelectedParticipants([]);

    setUseAllParticipants(true);

    setExpandedQuestions([]);

    setError("");

    if (value) {
      loadAnalytics(
        Number(value)
      );
    }
  }

  // =====================================================
  // Вибір усіх учасників
  // =====================================================

  function handleAllParticipantsChange() {
    if (!analytics) {
      return;
    }

    setUseAllParticipants(true);

    const allIds =
      analytics.participants.map(
        (participant) =>
          participant.id
      );

    setSelectedParticipants(allIds);

    // Одразу повертаємо аналітику
    // до всіх результатів.
    loadAnalytics(
      analytics.test.id
    );
  }

  // =====================================================
  // Вибір конкретного учасника
  // =====================================================

  function toggleParticipant(
    participantId: number
  ) {
    setUseAllParticipants(false);

    setSelectedParticipants(
      (previous) => {
        if (
          previous.includes(
            participantId
          )
        ) {
          return previous.filter(
            (id) =>
              id !== participantId
          );
        }

        return [
          ...previous,
          participantId,
        ];
      }
    );
  }

  // =====================================================
  // Застосувати вибір учасників
  // =====================================================

  function applyParticipants() {
    if (!analytics) {
      return;
    }

    if (
      !useAllParticipants &&
      selectedParticipants.length === 0
    ) {
      setError(
        "Оберіть хоча б одного учасника."
      );

      return;
    }

    setError("");

    loadAnalytics(
      analytics.test.id,
      useAllParticipants
        ? undefined
        : selectedParticipants
    );
  }

  // =====================================================
  // Розгортання питання
  // =====================================================

  function toggleQuestion(
    questionId: number
  ) {
    setExpandedQuestions(
      (previous) => {
        if (
          previous.includes(
            questionId
          )
        ) {
          return previous.filter(
            (id) =>
              id !== questionId
          );
        }

        return [
          ...previous,
          questionId,
        ];
      }
    );
  }

  // =====================================================
  // Вибрані об'єкти учасників
  // =====================================================

  const selectedParticipantObjects =
    useMemo(() => {
      if (!analytics) {
        return [];
      }

      return analytics.participants.filter(
        (participant) =>
          selectedParticipants.includes(
            participant.id
          )
      );
    }, [
      analytics,
      selectedParticipants,
    ]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-[1800px]">

        {/* ================================================= */}
        {/* ЗАГОЛОВОК */}
        {/* ================================================= */}

        <div className="mb-8">
          <div className="mb-3">
            <Link
              href="/admin"
              className="
                text-sm
                font-semibold
                text-[#7A1F2B]
                hover:underline
              "
            >
              ← Адміністративна панель
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-[#7A1F2B]">
            Аналітика тестування
          </h1>

          <p className="mt-2 text-gray-600">
            Аналіз результатів учасників
            та статистика виконання
            окремих завдань.
          </p>
        </div>

        {/* ================================================= */}
        {/* ВИБІР ТЕСТУ */}
        {/* ================================================= */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700">
            Оберіть тест
          </label>

          <select
            value={selectedTestId}
            onChange={(event) =>
              handleTestChange(
                event.target.value
              )
            }
            disabled={loadingTests}
            className="
              mt-2
              w-full
              max-w-3xl
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-3
              text-gray-800
              outline-none
              transition
              focus:border-[#7A1F2B]
              focus:ring-2
              focus:ring-[#7A1F2B]/20
            "
          >
            <option value="">
              {loadingTests
                ? "Завантаження тестів..."
                : "Оберіть тест"}
            </option>

            {tests.map((test) => (
              <option
                key={test.id}
                value={test.id}
              >
                {test.examType
                  ? `${test.examType} — `
                  : ""}
                {test.title}
                {test.subject
                  ? ` — ${test.subject}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* ================================================= */}
        {/* ПОМИЛКА */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {loadingAnalytics && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
            Формування аналітики...
          </div>
        )}

        {/* ================================================= */}
        {/* АНАЛІТИКА */}
        {/* ================================================= */}

        {analytics &&
          !loadingAnalytics && (
            <>
              {/* ================================================= */}
              {/* ІНФОРМАЦІЯ ПРО ТЕСТ */}
              {/* ================================================= */}

              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {analytics.test.title}
                    </h2>

                    <p className="mt-1 text-gray-500">
                      {analytics.test.subject}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 px-5 py-3 text-right">
                    <div className="text-sm text-gray-500">
                      Завдань
                    </div>

                    <div className="text-2xl font-bold text-[#7A1F2B]">
                      {
                        analytics.test
                          .questionCount
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================= */}
              {/* ВИБІР УЧАСНИКІВ */}
              {/* ================================================= */}

              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Учасники
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      За замовчуванням
                      враховуються всі
                      результати тестування.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      applyParticipants
                    }
                    disabled={
                      loadingAnalytics
                    }
                    className="
                      rounded-lg
                      bg-[#7A1F2B]
                      px-5
                      py-2.5
                      font-semibold
                      text-white
                      transition
                      hover:bg-[#651923]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    Застосувати
                  </button>
                </div>

                {/* ================================================= */}
                {/* УСІ УЧАСНИКИ */}
                {/* ================================================= */}

                <label
                  className="
                    flex
                    cursor-pointer
                    items-center
                    gap-3
                    rounded-lg
                    border
                    border-gray-200
                    p-4
                    transition
                    hover:bg-gray-50
                  "
                >
                  <input
                    type="radio"
                    checked={
                      useAllParticipants
                    }
                    onChange={
                      handleAllParticipantsChange
                    }
                    className="h-4 w-4 accent-[#7A1F2B]"
                  />

                  <span className="font-semibold text-gray-800">
                    Усі учасники
                  </span>

                  <span className="text-sm text-gray-500">
                    (
                    {
                      analytics
                        .participants
                        .length
                    }
                    )
                  </span>
                </label>

                {/* ================================================= */}
                {/* КОНКРЕТНІ УЧАСНИКИ */}
                {/* ================================================= */}

                <div className="mt-5">
                  <div className="mb-2 text-sm font-semibold text-gray-700">
                    Або оберіть конкретних
                    учасників:
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
                    {analytics.participants
                      .length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        Результатів цього
                        тесту поки немає.
                      </div>
                    ) : (
                      analytics.participants.map(
                        (participant) => (
                          <label
                            key={
                              participant.id
                            }
                            className="
                              flex
                              cursor-pointer
                              items-center
                              justify-between
                              gap-4
                              border-b
                              border-gray-100
                              px-4
                              py-3
                              last:border-b-0
                              hover:bg-gray-50
                            "
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedParticipants.includes(
                                  participant.id
                                )}
                                onChange={() =>
                                  toggleParticipant(
                                    participant.id
                                  )
                                }
                                className="h-4 w-4 accent-[#7A1F2B]"
                              />

                              <span className="font-medium text-gray-800">
                                {
                                  participant.name
                                }
                              </span>
                            </div>

                            <div className="whitespace-nowrap text-sm text-gray-500">
                              {
                                participant.earnedPoints
                              }{" "}
                              б. (
                              {
                                participant.percent
                              }
                              %)
                            </div>
                          </label>
                        )
                      )
                    )}
                  </div>
                </div>

                {/* ================================================= */}
                {/* КІЛЬКІСТЬ ВИБРАНИХ */}
                {/* ================================================= */}

                {!useAllParticipants && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    Обрано учасників:{" "}
                    <span className="font-bold text-gray-800">
                      {
                        selectedParticipantObjects.length
                      }
                    </span>
                  </div>
                )}

                {useAllParticipants && (
                  <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    У статистиці враховано
                    <span className="font-bold">
                      {" "}
                      усі{" "}
                      {
                        analytics
                          .participants
                          .length
                      }{" "}
                      результати
                    </span>
                    .
                  </div>
                )}
              </div>

              {/* ================================================= */}
              {/* ЗАГАЛЬНА СТАТИСТИКА */}
              {/* ================================================= */}

              <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                {/* Учасники */}

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="text-sm text-gray-500">
                    Учасників
                  </div>

                  <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
                    {
                      analytics.summary
                        .participants
                    }
                  </div>

                  <div className="mt-1 text-sm text-gray-400">
                    враховано в аналізі
                  </div>
                </div>

                {/* Максимальний бал */}

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="text-sm text-gray-500">
                    Максимальний бал
                  </div>

                  <div className="mt-2 text-3xl font-bold text-green-600">
                    {
                      analytics.summary
                        .maxScore
                    }
                  </div>

                  <div className="mt-1 text-sm text-gray-400">
                    найкращий результат
                    учасника
                  </div>
                </div>

                {/* Мінімальний бал */}

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="text-sm text-gray-500">
                    Мінімальний бал
                  </div>

                  <div className="mt-2 text-3xl font-bold text-red-600">
                    {
                      analytics.summary
                        .minScore
                    }
                  </div>

                  <div className="mt-1 text-sm text-gray-400">
                    найнижчий результат
                    учасника
                  </div>
                </div>

                {/* Середній бал */}

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="text-sm text-gray-500">
                    Середній бал
                  </div>

                  <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
                    {
                      analytics.summary
                        .averageScore
                    }
                  </div>

                  <div className="mt-1 text-sm text-gray-400">
                    балів (
                    {
                      analytics.summary
                        .averagePercent
                    }
                    %)
                  </div>
                </div>
              </div>

              {/* ================================================= */}
              {/* СТАТИСТИКА ЗАВДАНЬ */}
              {/* ================================================= */}

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="border-b border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Статистика завдань
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Натисніть на номер питання,
                    щоб переглянути його текст.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full">
                    <thead className="bg-[#7A1F2B] text-white">
                      <tr>
                        <th className="w-24 whitespace-nowrap p-4 text-center">
                          №
                        </th>

                        <th className="whitespace-nowrap p-4 text-center">
                          Правильні
                        </th>

                        <th className="whitespace-nowrap p-4 text-center">
                          Неправильні
                        </th>

                        <th className="whitespace-nowrap p-4 text-center">
                          Пропущені
                        </th>

                        <th className="whitespace-nowrap p-4 text-center">
                          Складність
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {analytics.questions.length ===
                      0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-12 text-center text-gray-500"
                          >
                            Завдань для аналізу
                            немає.
                          </td>
                        </tr>
                      ) : (
                        analytics.questions.map(
                          (question) => {
                            const expanded =
                              expandedQuestions.includes(
                                question.id
                              );

                            return (
                              <tr
                                key={
                                  question.id
                                }
                                className="border-b border-gray-100"
                              >
                                <td
                                  colSpan={5}
                                  className="p-0"
                                >
                                  {/* ================================================= */}
                                  {/* РЯДОК СТАТИСТИКИ */}
                                  {/* ================================================= */}

                                  <div
                                    className="
                                      grid
                                      grid-cols-[96px_repeat(4,minmax(160px,1fr))]
                                      items-center
                                    "
                                  >
                                    {/* № */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleQuestion(
                                          question.id
                                        )
                                      }
                                      className="
                                        flex
                                        min-h-[88px]
                                        items-center
                                        justify-center
                                        gap-2
                                        border-r
                                        border-gray-100
                                        p-4
                                        font-bold
                                        text-[#7A1F2B]
                                        transition
                                        hover:bg-gray-50
                                      "
                                      title={
                                        expanded
                                          ? "Згорнути питання"
                                          : "Показати питання"
                                      }
                                    >
                                      <span className="text-lg">
                                        {
                                          question.order
                                        }
                                      </span>

                                      <span className="text-xs text-gray-400">
                                        {expanded
                                          ? "▲"
                                          : "▼"}
                                      </span>
                                    </button>

                                    {/* ================================================= */}
                                    {/* ПРАВИЛЬНІ */}
                                    {/* ================================================= */}

                                    <div className="min-h-[88px] p-4 text-center">
                                      <div className="font-bold text-green-600">
                                        {
                                          question.correctPercent
                                        }
                                        %
                                      </div>

                                      <div className="mt-1 text-xs text-gray-400">
                                        {
                                          question.correct
                                        }{" "}
                                        уч.
                                      </div>
                                    </div>

                                    {/* ================================================= */}
                                    {/* НЕПРАВИЛЬНІ */}
                                    {/* ================================================= */}

                                    <div className="min-h-[88px] p-4 text-center">
                                      <div className="font-bold text-red-600">
                                        {
                                          question.incorrectPercent
                                        }
                                        %
                                      </div>

                                      <div className="mt-1 text-xs text-gray-400">
                                        {
                                          question.incorrect
                                        }{" "}
                                        уч.
                                      </div>
                                    </div>

                                    {/* ================================================= */}
                                    {/* ПРОПУЩЕНІ */}
                                    {/* ================================================= */}

                                    <div className="min-h-[88px] p-4 text-center">
                                      <div className="font-bold text-gray-500">
                                        {
                                          question.skippedPercent
                                        }
                                        %
                                      </div>

                                      <div className="mt-1 text-xs text-gray-400">
                                        {
                                          question.skipped
                                        }{" "}
                                        уч.
                                      </div>
                                    </div>

                                    {/* ================================================= */}
                                    {/* СКЛАДНІСТЬ */}
                                    {/* ================================================= */}

                                    <div className="min-h-[88px] p-4 text-center">
                                      <span
                                        className={`
                                          inline-flex
                                          rounded-full
                                          px-4
                                          py-2
                                          text-sm
                                          font-semibold
                                          ${getDifficultyClasses(
                                            question
                                              .difficulty
                                              .color
                                          )}
                                        `}
                                      >
                                        {
                                          question
                                            .difficulty
                                            .color ===
                                          "green"
                                            ? question
                                                .difficulty
                                                .label ===
                                              "Дуже легке"
                                              ? "🟢 "
                                              : "🟢 "
                                            : question
                                                .difficulty
                                                .color ===
                                              "yellow"
                                            ? "🟡 "
                                            : question
                                                .difficulty
                                                .color ===
                                              "orange"
                                            ? "🟠 "
                                            : "🔴 "
                                        }

                                        {
                                          question
                                            .difficulty
                                            .label
                                        }
                                      </span>
                                    </div>
                                  </div>

                                  {/* ================================================= */}
                                  {/* ТЕКСТ ПИТАННЯ */}
                                  {/* ================================================= */}

                                  {expanded && (
                                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-6">
                                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="text-sm font-bold text-[#7A1F2B]">
                                          Питання №{" "}
                                          {
                                            question.order
                                          }
                                        </div>

                                        <div className="text-sm text-gray-500">
                                          Максимум:{" "}
                                          <span className="font-semibold text-gray-700">
                                            {
                                              question.points
                                            }{" "}
                                            б.
                                          </span>
                                        </div>
                                      </div>

                                      <div className="rounded-lg border border-gray-200 bg-white p-5">
                                        <div className="whitespace-pre-wrap leading-7 text-gray-800">
                                          {
                                            question.text
                                          }
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ================================================= */}
              {/* ПОЗНАЧЕННЯ СКЛАДНОСТІ */}
              {/* ================================================= */}

              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800">
                  Шкала складності завдань
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="font-semibold text-green-800">
                      🟢 Дуже легке
                    </div>

                    <div className="mt-1 text-sm text-green-700">
                      &gt; 80% правильних
                    </div>
                  </div>

                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="font-semibold text-green-800">
                      🟢 Легке
                    </div>

                    <div className="mt-1 text-sm text-green-700">
                      60–79% правильних
                    </div>
                  </div>

                  <div className="rounded-lg bg-yellow-50 p-3">
                    <div className="font-semibold text-yellow-800">
                      🟡 Оптимальне
                    </div>

                    <div className="mt-1 text-sm text-yellow-700">
                      40–59% правильних
                    </div>
                  </div>

                  <div className="rounded-lg bg-orange-50 p-3">
                    <div className="font-semibold text-orange-800">
                      🟠 Складне
                    </div>

                    <div className="mt-1 text-sm text-orange-700">
                      21–39% правильних
                    </div>
                  </div>

                  <div className="rounded-lg bg-red-50 p-3">
                    <div className="font-semibold text-red-800">
                      🔴 Дуже складне
                    </div>

                    <div className="mt-1 text-sm text-red-700">
                      ≤ 20% правильних
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        {/* ================================================= */}
        {/* ТЕСТ НЕ ОБРАНО */}
        {/* ================================================= */}

        {!selectedTestId &&
          !loadingTests && (
            <div className="rounded-xl border border-gray-200 bg-white p-16 text-center shadow-sm">
              <div className="text-5xl">
                📊
              </div>

              <h2 className="mt-5 text-2xl font-bold text-gray-700">
                Оберіть тест для аналізу
              </h2>

              <p className="mt-2 text-gray-500">
                Після вибору тесту тут
                з'явиться детальна
                статистика його виконання.
              </p>
            </div>
          )}
      </div>
    </main>
  );
}