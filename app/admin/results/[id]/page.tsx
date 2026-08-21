import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

/* ============================================================
   ДОПОМІЖНІ ФУНКЦІЇ
============================================================ */

function formatDate(date: Date | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("uk-UA", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return "00:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

/* ============================================================
   ОЧИЩЕННЯ HTML

   Наприклад:

   <p>гара<strong><em>н</em></strong>тія</p>

   перетворюється на:

   гарантія
============================================================ */

function stripHtml(
  html: string | null | undefined
) {
  if (!html) {
    return "";
  }

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getParticipantName(result: {
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
}) {
  const parts = [
    result.lastName,
    result.firstName,
    result.middleName,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(" ")
    : "Не вказано";
}

function getFinishReason(reason: string) {
  switch (reason) {
    case "manual":
      return {
        label: "Завершено вручну",
        className:
          "bg-green-100 text-green-800 border-green-200",
        icon: "✓",
      };

    case "timeout":
      return {
        label: "Час вичерпано",
        className:
          "bg-orange-100 text-orange-800 border-orange-200",
        icon: "⏱",
      };

    case "security":
      return {
        label: "Порушення правил",
        className:
          "bg-red-100 text-red-800 border-red-200",
        icon: "!",
      };

    default:
      return {
        label: reason || "Не вказано",
        className:
          "bg-gray-100 text-gray-800 border-gray-200",
        icon: "•",
      };
  }
}

function getSavedAnswer(
  answers: unknown,
  questionId: number
): number[] {
  if (!answers || typeof answers !== "object") {
    return [];
  }

  const data =
    answers as Record<string, unknown>;

  const answer =
    data[String(questionId)];

  if (!Array.isArray(answer)) {
    return [];
  }

  return answer.filter(
    (value): value is number =>
      typeof value === "number"
  );
}

/* ============================================================
   СТАТУС ЗВИЧАЙНОГО ПИТАННЯ
============================================================ */

function getQuestionStatus(
  question: {
    options: {
      id: number;
      isCorrect: boolean;
    }[];
  },
  selectedAnswers: number[]
) {
  if (selectedAnswers.length === 0) {
    return {
      label: "Без відповіді",
      className:
        "bg-gray-100 text-gray-600 border-gray-200",
      pointsClass: "text-gray-500",
      icon: "—",
    };
  }

  const correctIds =
    question.options
      .filter(
        (option) =>
          option.isCorrect
      )
      .map(
        (option) =>
          option.id
      )
      .sort(
        (a, b) => a - b
      );

  const selectedIds =
    [...selectedAnswers].sort(
      (a, b) => a - b
    );

  const isCorrect =
    correctIds.length ===
      selectedIds.length &&
    correctIds.every(
      (id, index) =>
        id === selectedIds[index]
    );

  if (isCorrect) {
    return {
      label: "Правильно",
      className:
        "bg-green-100 text-green-700 border-green-200",
      pointsClass:
        "text-green-600",
      icon: "✓",
    };
  }

  return {
    label: "Неправильно",
    className:
      "bg-red-100 text-red-700 border-red-200",
    pointsClass:
      "text-red-600",
    icon: "×",
  };
}

/* ============================================================
   MATCHING — ОТРИМАННЯ ВІДПОВІДНОСТЕЙ
============================================================ */

function getMatchingData(question: {
  options: {
    id: number;
    text: string;
    order?: number;
  }[];
}) {
  const leftItems = question.options
    .filter((option) =>
      option.text?.startsWith("L|")
    )
    .map((option) => {
      const parts =
        option.text.split("|");

      return {
        id: Number(parts[1]),
        text: parts[2] ?? "",
        correctRightId:
          Number(parts[3]),
      };
    })
    .sort(
      (a, b) => a.id - b.id
    );

  const rightItems = question.options
    .filter((option) =>
      option.text?.startsWith("R|")
    )
    .map((option) => {
      const parts =
        option.text.split("|");

      return {
        id: Number(parts[1]),
        text: parts
          .slice(2)
          .join("|"),
      };
    })
    .sort(
      (a, b) => a.id - b.id
    );

  return {
    leftItems,
    rightItems,
  };
}

/* ============================================================
   MATCHING — СТАТУС
============================================================ */

function getMatchingStatus(
  question: {
    options: {
      id: number;
      text: string;
    }[];
  },
  selectedAnswers: number[]
) {
  const {
    leftItems,
  } = getMatchingData(question);

  if (
    leftItems.length === 0 ||
    selectedAnswers.length === 0
  ) {
    return {
      label:
        selectedAnswers.length === 0
          ? "Без відповіді"
          : "Неправильно",
      className:
        selectedAnswers.length === 0
          ? "bg-gray-100 text-gray-600 border-gray-200"
          : "bg-red-100 text-red-700 border-red-200",
      pointsClass:
        selectedAnswers.length === 0
          ? "text-gray-500"
          : "text-red-600",
      icon:
        selectedAnswers.length === 0
          ? "—"
          : "×",
    };
  }

  let correctPairs = 0;

  leftItems.forEach(
    (leftItem, index) => {
      if (
        selectedAnswers[index] ===
        leftItem.correctRightId
      ) {
        correctPairs++;
      }
    }
  );

  if (
    correctPairs ===
    leftItems.length
  ) {
    return {
      label: "Правильно",
      className:
        "bg-green-100 text-green-700 border-green-200",
      pointsClass:
        "text-green-600",
      icon: "✓",
    };
  }

  return {
    label: "Неправильно",
    className:
      "bg-red-100 text-red-700 border-red-200",
    pointsClass:
      "text-red-600",
    icon: "×",
  };
}

/* ============================================================
   MATCHING — КІЛЬКІСТЬ ПРАВИЛЬНИХ ПАР
============================================================ */

function getMatchingCorrectPairs(
  question: {
    options: {
      id: number;
      text: string;
    }[];
  },
  selectedAnswers: number[]
) {
  const {
    leftItems,
  } = getMatchingData(question);

  let correctPairs = 0;

  leftItems.forEach(
    (leftItem, index) => {
      if (
        selectedAnswers[index] ===
        leftItem.correctRightId
      ) {
        correctPairs++;
      }
    }
  );

  return {
    correctPairs,
    totalPairs:
      leftItems.length,
  };
}

/* ============================================================
   ОСНОВНА СТОРІНКА
============================================================ */

export default async function ResultDetailsPage({
  params,
}: Props) {
  const { id } = await params;

  const result =
    await prisma.testResult.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        test: {
          include: {
            questions: {
              orderBy: {
                order: "asc",
              },
              include: {
                options: {
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!result) {
    notFound();
  }

  const participantName =
    getParticipantName(result);

  const finishReason =
    getFinishReason(
      result.finishReason
    );

  return (
    <main className="min-h-screen bg-[#f5f5f6]">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ==================================================
            ВЕРХНЯ ПАНЕЛЬ
        ================================================== */}

        <header
          className="
            mb-6
            overflow-hidden
            rounded-2xl
            bg-[#7A1F2B]
            shadow-lg
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              px-6
              py-7
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-8
            "
          >

            <div>

              <div className="mb-2 text-sm font-medium text-white/70">
                Результат тестування
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Деталі результату
              </h1>

              <p className="mt-2 text-sm text-white/75 sm:text-base">
                Повна інформація про проходження тестування
              </p>

            </div>

            <Link
              href="/admin/results"
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                border
                border-white/30
                bg-white/10
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                backdrop-blur
                transition
                hover:bg-white
                hover:text-[#7A1F2B]
              "
            >
              ← До журналу
            </Link>

          </div>
        </header>

        {/* ==================================================
            УЧАСНИК + ТЕСТ
        ================================================== */}

        <div className="mb-6 grid gap-6 lg:grid-cols-2">

          {/* УЧАСНИК */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center gap-4">

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#7A1F2B]/10
                  text-xl
                "
              >
                👤
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Учасник
                </h2>

                <p className="text-sm text-gray-500">
                  Дані учасника тестування
                </p>
              </div>

            </div>

            <div className="space-y-4">

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  ПІБ
                </div>

                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {participantName}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Код учасника
                </div>

                <div className="mt-2">
                  {result.accessCode ? (
                    <span
                      className="
                        inline-flex
                        rounded-lg
                        bg-gray-100
                        px-3
                        py-1.5
                        font-mono
                        text-base
                        font-semibold
                        text-gray-700
                      "
                    >
                      {result.accessCode}
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      —
                    </span>
                  )}
                </div>
              </div>

            </div>

          </section>

          {/* ТЕСТ */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center gap-4">

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#7A1F2B]/10
                  text-xl
                "
              >
                📝
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Тестування
                </h2>

                <p className="text-sm text-gray-500">
                  Основна інформація про тест
                </p>
              </div>

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Назва тесту
                </div>

                <div className="mt-1 font-semibold text-gray-900">
                  {result.test.title}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Предмет
                </div>

                <div className="mt-1 font-semibold text-gray-900">
                  {result.test.subject}
                </div>
              </div>

            </div>

          </section>

        </div>

        {/* ==================================================
            ЧАС
        ================================================== */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-4">

            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-gray-100
                text-xl
              "
            >
              ⏱
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Час проходження
              </h2>

              <p className="text-sm text-gray-500">
                Час початку, завершення та тривалість
              </p>
            </div>

          </div>

          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-gray-50 p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Початок
              </div>

              <div className="mt-2 font-semibold text-gray-900">
                {formatDate(result.startedAt)}
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Завершення
              </div>

              <div className="mt-2 font-semibold text-gray-900">
                {formatDate(result.finishedAt)}
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Витрачено часу
              </div>

              <div className="mt-2 font-mono text-xl font-bold text-[#7A1F2B]">
                {formatDuration(
                  result.timeSpent
                )}
              </div>
            </div>

          </div>

        </section>

        {/* ==================================================
            РЕЗУЛЬТАТ
        ================================================== */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-4">

            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-[#7A1F2B]/10
                text-xl
              "
            >
              🏆
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Результат
              </h2>

              <p className="text-sm text-gray-500">
                Підсумкові показники тестування
              </p>
            </div>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            {/* БАЛИ */}

            <div className="rounded-xl bg-gray-50 p-5 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Бали
              </div>

              <div className="mt-2 text-2xl font-bold text-[#7A1F2B]">
                {result.earnedPoints} /{" "}
                {result.maxPoints}
              </div>
            </div>

            {/* ВІДСОТОК */}

            <div className="rounded-xl bg-gray-50 p-5 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Результат
              </div>

              <div
                className={`mt-2 text-2xl font-bold ${
                  result.percent >= 80
                    ? "text-green-600"
                    : result.percent >= 50
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              >
                {result.percent}%
              </div>
            </div>

            {/* ПРАВИЛЬНІ */}

            <div className="rounded-xl bg-green-50 p-5 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-green-700/60">
                Правильні
              </div>

              <div className="mt-2 text-2xl font-bold text-green-600">
                {result.correct}
              </div>
            </div>

            {/* НЕПРАВИЛЬНІ */}

            <div className="rounded-xl bg-red-50 p-5 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-red-700/60">
                Неправильні
              </div>

              <div className="mt-2 text-2xl font-bold text-red-600">
                {result.incorrect}
              </div>
            </div>

            {/* ПРОПУЩЕНІ */}

            <div className="rounded-xl bg-gray-50 p-5 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Пропущені
              </div>

              <div className="mt-2 text-2xl font-bold text-gray-500">
                {result.skipped}
              </div>
            </div>

          </div>

        </section>

        {/* ==================================================
            ПРИЧИНА ЗАВЕРШЕННЯ
        ================================================== */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Завершення тестування
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Причина завершення тестової сесії
              </p>
            </div>

            <span
              className={`
                inline-flex
                w-fit
                items-center
                gap-2
                rounded-full
                border
                px-4
                py-2
                text-sm
                font-semibold
                ${finishReason.className}
              `}
            >
              <span className="font-bold">
                {finishReason.icon}
              </span>

              {finishReason.label}
            </span>

          </div>

        </section>

        {/* ==================================================
            ЖУРНАЛ ВІДПОВІДЕЙ
        ================================================== */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-7">

            <div className="flex items-center gap-4">

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#7A1F2B]/10
                  text-xl
                "
              >
                📋
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Журнал відповідей
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Детальний перегляд усіх завдань та відповідей учасника
                </p>
              </div>

            </div>

          </div>

          <div className="space-y-6">

            {result.test.questions.map(
              (question, index) => {

                const selectedAnswers =
                  getSavedAnswer(
                    result.answers,
                    question.id
                  );

                const isMatching =
                  question.type ===
                  "matching";

                /* ==================================================
                   MATCHING
                ================================================== */

                if (isMatching) {

                  const {
                    leftItems,
                    rightItems,
                  } =
                    getMatchingData(
                      question
                    );

                  const {
                    correctPairs,
                    totalPairs,
                  } =
                    getMatchingCorrectPairs(
                      question,
                      selectedAnswers
                    );

                  const status =
                    getMatchingStatus(
                      question,
                      selectedAnswers
                    );

                  return (
                    <article
                      key={question.id}
                      className="
                        overflow-hidden
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                      "
                    >

                      {/* HEADER */}

                      <div className="bg-gray-50 p-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex items-center gap-4">

                            <div
                              className="
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-[#7A1F2B]
                                font-bold
                                text-white
                              "
                            >
                              {index + 1}
                            </div>

                            <div>

                              <div className="text-sm font-medium text-gray-500">
                                Завдання {index + 1}
                              </div>

                              <div className="mt-1 font-semibold text-gray-900">
                                {question.points}{" "}
                                {question.points === 1
                                  ? "бал"
                                  : "бали"}
                              </div>

                            </div>

                          </div>

                          <span
                            className={`
                              inline-flex
                              w-fit
                              items-center
                              gap-2
                              rounded-full
                              border
                              px-4
                              py-2
                              text-sm
                              font-semibold
                              ${status.className}
                            `}
                          >
                            <span className="font-bold">
                              {status.icon}
                            </span>

                            {status.label}
                          </span>

                        </div>

                      </div>

                      {/* CONTENT */}

                      <div className="p-5 sm:p-6">

                        {/* УМОВА */}

                        <div className="mb-7">

                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Умова
                          </div>

                          <div className="whitespace-pre-wrap text-lg leading-8 text-gray-900">
                            {stripHtml(
                              question.text
                            )}
                          </div>

                        </div>

                        {/* MATCHING */}

                        <div>

                          <div className="mb-3 text-sm font-semibold text-gray-600">
                            Відповідності учасника
                          </div>

                          {leftItems.length === 0 ? (
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                              Дані відповідності відсутні.
                            </div>
                          ) : (
                            <div className="overflow-hidden rounded-xl border border-gray-200">

                              {leftItems.map(
                                (
                                  leftItem,
                                  leftIndex
                                ) => {

                                  const selectedRightId =
                                    selectedAnswers[
                                      leftIndex
                                    ];

                                  const correct =
                                    selectedRightId ===
                                    leftItem.correctRightId;

                                  const selectedRight =
                                    rightItems.find(
                                      (
                                        right
                                      ) =>
                                        right.id ===
                                        selectedRightId
                                    );

                                  const correctRight =
                                    rightItems.find(
                                      (
                                        right
                                      ) =>
                                        right.id ===
                                        leftItem.correctRightId
                                    );

                                  return (
                                    <div
                                      key={leftItem.id}
                                      className={`
                                        grid
                                        gap-4
                                        border-b
                                        border-gray-200
                                        p-4
                                        last:border-b-0
                                        sm:grid-cols-[1fr_auto_1fr]
                                        sm:items-center
                                        ${
                                          correct
                                            ? "bg-green-50/60"
                                            : "bg-red-50/40"
                                        }
                                      `}
                                    >

                                      {/* LEFT */}

                                      <div className="rounded-lg border border-gray-200 bg-white p-3">

                                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                                          Ліва частина
                                        </div>

                                        <div className="font-medium text-gray-900">
                                          {stripHtml(
                                            leftItem.text
                                          )}
                                        </div>

                                      </div>

                                      {/* ARROW */}

                                      <div
                                        className={`
                                          hidden
                                          text-xl
                                          font-bold
                                          sm:block
                                          ${
                                            correct
                                              ? "text-green-500"
                                              : "text-red-500"
                                          }
                                        `}
                                      >
                                        →
                                      </div>

                                      {/* RIGHT */}

                                      <div
                                        className={`
                                          rounded-lg
                                          border
                                          p-3
                                          ${
                                            correct
                                              ? "border-green-200 bg-green-100"
                                              : "border-red-200 bg-red-100"
                                          }
                                        `}
                                      >

                                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                                          Відповідь учасника
                                        </div>

                                        <div
                                          className={`
                                            font-medium
                                            ${
                                              correct
                                                ? "text-green-800"
                                                : "text-red-800"
                                            }
                                          `}
                                        >
                                          {selectedRight
                                            ? stripHtml(
                                                selectedRight.text
                                              )
                                            : "Без відповіді"}
                                        </div>

                                        {!correct &&
                                          correctRight && (
                                            <div className="mt-3 border-t border-red-200 pt-2">

                                              <div className="text-xs font-medium text-gray-500">
                                                Правильна відповідність
                                              </div>

                                              <div className="mt-1 text-sm font-semibold text-green-700">
                                                {stripHtml(
                                                  correctRight.text
                                                )}
                                              </div>

                                            </div>
                                          )}

                                      </div>

                                    </div>
                                  );
                                }
                              )}

                            </div>
                          )}

                        </div>

                        {/* ПІДСУМОК MATCHING */}

                        {totalPairs > 0 && (
                          <div className="mt-6 rounded-xl bg-gray-50 p-5">

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                              <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                  Результат відповідності
                                </div>

                                <div className="mt-1 text-lg font-bold text-gray-900">
                                  {correctPairs} з{" "}
                                  {totalPairs}{" "}
                                  правильних пар
                                </div>
                              </div>

                              <div
                                className={`
                                  text-2xl
                                  font-bold
                                  ${
                                    correctPairs ===
                                    totalPairs
                                      ? "text-green-600"
                                      : correctPairs > 0
                                      ? "text-orange-600"
                                      : "text-red-600"
                                  }
                                `}
                              >
                                {Math.round(
                                  (correctPairs /
                                    totalPairs) *
                                    100
                                )}
                                %
                              </div>

                            </div>

                          </div>
                        )}

                      </div>

                    </article>
                  );
                }

                /* ==================================================
                   SINGLE / MULTIPLE
                ================================================== */

                const status =
                  getQuestionStatus(
                    question,
                    selectedAnswers
                  );

                const correctOptions =
                  question.options.filter(
                    (option) =>
                      option.isCorrect
                  );

                const selectedOptions =
                  question.options.filter(
                    (option) =>
                      selectedAnswers.includes(
                        option.id
                      )
                  );

                return (
                  <article
                    key={question.id}
                    className="
                      overflow-hidden
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                    "
                  >

                    {/* HEADER */}

                    <div className="bg-gray-50 p-5">

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-4">

                          <div
                            className="
                              flex
                              h-11
                              w-11
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-[#7A1F2B]
                              font-bold
                              text-white
                            "
                          >
                            {index + 1}
                          </div>

                          <div>

                            <div className="text-sm font-medium text-gray-500">
                              Завдання {index + 1}
                            </div>

                            <div className="mt-1 font-semibold text-gray-900">
                              {question.points}{" "}
                              {question.points === 1
                                ? "бал"
                                : "бали"}
                            </div>

                          </div>

                        </div>

                        <span
                          className={`
                            inline-flex
                            w-fit
                            items-center
                            gap-2
                            rounded-full
                            border
                            px-4
                            py-2
                            text-sm
                            font-semibold
                            ${status.className}
                          `}
                        >
                          <span className="font-bold">
                            {status.icon}
                          </span>

                          {status.label}
                        </span>

                      </div>

                    </div>

                    {/* CONTENT */}

                    <div className="p-5 sm:p-6">

                      {/* УМОВА */}

                      <div className="mb-7">

                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Умова
                        </div>

                        <div className="whitespace-pre-wrap text-lg leading-8 text-gray-900">
                          {stripHtml(
                            question.text
                          )}
                        </div>

                      </div>

                      {/* ВАРІАНТИ */}

                      {question.options.length > 0 && (

                        <div>

                          <div className="mb-3 text-sm font-semibold text-gray-600">
                            Варіанти відповідей
                          </div>

                          <div className="space-y-3">

                            {question.options.map(
                              (option) => {

                                const selected =
                                  selectedAnswers.includes(
                                    option.id
                                  );

                                const correct =
                                  option.isCorrect;

                                let className =
                                  "border-gray-200 bg-white";

                                if (
                                  correct &&
                                  selected
                                ) {
                                  className =
                                    "border-green-300 bg-green-50";
                                } else if (
                                  correct
                                ) {
                                  className =
                                    "border-green-200 bg-green-50/70";
                                } else if (
                                  selected
                                ) {
                                  className =
                                    "border-red-300 bg-red-50";
                                }

                                return (
                                  <div
                                    key={option.id}
                                    className={`
                                      rounded-xl
                                      border
                                      p-4
                                      transition
                                      ${className}
                                    `}
                                  >

                                    <div className="flex items-start gap-3">

                                      <div
                                        className="
                                          flex
                                          h-8
                                          w-8
                                          shrink-0
                                          items-center
                                          justify-center
                                          rounded-full
                                          border
                                          border-gray-300
                                          bg-white
                                          text-sm
                                          font-bold
                                          text-gray-700
                                        "
                                      >
                                        {String.fromCharCode(
                                          65 +
                                            option.order
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">

                                        <div className="text-base leading-7 text-gray-900">
                                          {stripHtml(
                                            option.text
                                          )}
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">

                                          {selected && (
                                            <span
                                              className="
                                                rounded-full
                                                bg-[#7A1F2B]
                                                px-3
                                                py-1
                                                text-xs
                                                font-semibold
                                                text-white
                                              "
                                            >
                                              Відповідь учасника
                                            </span>
                                          )}

                                          {correct && (
                                            <span
                                              className="
                                                rounded-full
                                                bg-green-600
                                                px-3
                                                py-1
                                                text-xs
                                                font-semibold
                                                text-white
                                              "
                                            >
                                              Правильна відповідь
                                            </span>
                                          )}

                                        </div>

                                      </div>

                                    </div>

                                  </div>
                                );
                              }
                            )}

                          </div>

                        </div>
                      )}

                      {/* ПІДСУМОК */}

                      <div className="mt-6 border-t border-gray-200 pt-5">

                        <div className="grid gap-5 md:grid-cols-2">

                          <div className="rounded-xl bg-gray-50 p-4">

                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Обрано
                            </div>

                            <div className="mt-2 font-semibold leading-6 text-gray-900">

                              {selectedOptions.length > 0
                                ? selectedOptions
                                    .map(
                                      (option) =>
                                        stripHtml(
                                          option.text
                                        )
                                    )
                                    .join(", ")
                                : "Без відповіді"}

                            </div>

                          </div>

                          <div className="rounded-xl bg-gray-50 p-4">

                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Правильна відповідь
                            </div>

                            <div
                              className={`
                                mt-2
                                font-semibold
                                leading-6
                                ${status.pointsClass}
                              `}
                            >

                              {correctOptions.length > 0
                                ? correctOptions
                                    .map(
                                      (option) =>
                                        stripHtml(
                                          option.text
                                        )
                                    )
                                    .join(", ")
                                : "Не визначено"}

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        </section>

        {/* ==================================================
            НИЖНЯ КНОПКА
        ================================================== */}

        <div className="mt-7 flex justify-center">

          <Link
            href="/admin/results"
            className="
              inline-flex
              items-center
              justify-center
              rounded-xl
              bg-[#7A1F2B]
              px-7
              py-3.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-[#651923]
              hover:shadow-md
            "
          >
            ← Повернутися до журналу
          </Link>

        </div>

        <div className="py-8 text-center text-xs text-gray-400">
          Адміністративна панель платформи тестування
        </div>

      </div>
    </main>
  );
}