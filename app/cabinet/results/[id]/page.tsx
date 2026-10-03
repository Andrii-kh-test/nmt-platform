import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth/session";
import HtmlContent from "@/app/components/common/HtmlContent";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Date(date).toLocaleString("uk-UA", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function formatDuration(seconds: number) {
  if (seconds <= 0) return "00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function stripHtml(html: string | null | undefined) {
  if (!html) return "";

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

  const data = answers as Record<string, unknown>;
  const answer = data[String(questionId)];

  if (!Array.isArray(answer)) {
    return [];
  }

  return answer.filter(
    (value): value is number => typeof value === "number"
  );
}

function getQuestionStatus(
  question: {
    answerOptions: Array<{
      id: number;
      isCorrect: boolean;
    }>;
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

  const correctIds = question.answerOptions
    .filter((option) => option.isCorrect)
    .map((option) => option.id)
    .sort((a, b) => a - b);

  const selectedIds = [...selectedAnswers].sort(
    (a, b) => a - b
  );

  const isCorrect =
    correctIds.length === selectedIds.length &&
    correctIds.every(
      (id, index) => id === selectedIds[index]
    );

  if (isCorrect) {
    return {
      label: "Правильно",
      className:
        "bg-green-100 text-green-700 border-green-200",
      pointsClass: "text-green-600",
      icon: "✓",
    };
  }

  return {
    label: "Неправильно",
    className:
      "bg-red-100 text-red-700 border-red-200",
    pointsClass: "text-red-600",
    icon: "×",
  };
}

function getMatchingData(question: {
  answerOptions: Array<{
    id: number;
    text: string;
    order: number;
  }>;
}) {
  const leftItems = question.answerOptions
    .filter((option) => option.text.startsWith("L|"))
    .map((option) => {
      const parts = option.text.split("|");

      return {
        id: Number(parts[1]),
        text: parts[2] ?? "",
        correctRightId: Number(parts[3]),
      };
    })
    .sort((a, b) => a.id - b.id);

  const rightItems = question.answerOptions
    .filter((option) => option.text.startsWith("R|"))
    .map((option) => {
      const parts = option.text.split("|");

      return {
        id: Number(parts[1]),
        text: parts.slice(2).join("|"),
      };
    })
    .sort((a, b) => a.id - b.id);

  return {
    leftItems,
    rightItems,
  };
}

function getMatchingStatus(
  question: {
    answerOptions: Array<{
      id: number;
      text: string;
      order: number;
    }>;
  },
  selectedAnswers: number[]
) {
  const { leftItems } = getMatchingData(question);

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

  leftItems.forEach((leftItem, index) => {
    if (
      selectedAnswers[index] ===
      leftItem.correctRightId
    ) {
      correctPairs++;
    }
  });

  if (correctPairs === leftItems.length) {
    return {
      label: "Правильно",
      className:
        "bg-green-100 text-green-700 border-green-200",
      pointsClass: "text-green-600",
      icon: "✓",
    };
  }

  return {
    label: "Неправильно",
    className:
      "bg-red-100 text-red-700 border-red-200",
    pointsClass: "text-red-600",
    icon: "×",
  };
}

function getMatchingCorrectPairs(
  question: {
    answerOptions: Array<{
      id: number;
      text: string;
      order: number;
    }>;
  },
  selectedAnswers: number[]
) {
  const { leftItems } = getMatchingData(question);

  let correctPairs = 0;

  leftItems.forEach((leftItem, index) => {
    if (
      selectedAnswers[index] ===
      leftItem.correctRightId
    ) {
      correctPairs++;
    }
  });

  return {
    correctPairs,
    totalPairs: leftItems.length,
  };
}

export default async function ParticipantResultDetailsPage({
  params,
}: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const resultId = Number(id);

  if (!Number.isInteger(resultId) || resultId <= 0) {
    notFound();
  }

  /*
   * ПЕРШИЙ ЗАПИТ
   *
   * Тут навмисно НЕ завантажуємо питання.
   *
   * Власник результату визначається через:
   *
   * User
   *   ↓
   * Participant
   *   ↓
   * TestSession
   *   ↓
   * TestResult
   */
  const result = await prisma.testResult.findFirst({
    where: {
      id: resultId,

      session: {
        participant: {
          userId: user.id,
        },
      },
    },

    include: {
      test: true,
    },
  });

  if (!result) {
    notFound();
  }

  const finishReason = getFinishReason(
    result.finishReason
  );

  /*
   * ПИТАННЯ ЗАВАНТАЖУЄМО ЛИШЕ ЯКЩО АДМІНІСТРАТОР
   * ДОЗВОЛИВ ЇХ ПЕРЕГЛЯД.
   */
  let questions: Array<{
    id: number;
    type: string;
    text: string;
    points: number;
    answerOptions: Array<{
      id: number;
      order: number;
      text: string;
      isCorrect: boolean;
    }>;
  }> = [];

  if (result.allowParticipantDetails) {
    const detailedResult =
      await prisma.testResult.findUnique({
        where: {
          id: result.id,
        },

        include: {
          test: {
            include: {
              questions: {
                orderBy: {
                  order: "asc",
                },

                include: {
                  question: {
                    include: {
                      answerOptions: {
                        orderBy: {
                          order: "asc",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (detailedResult) {
      questions = detailedResult.test.questions.map(
        (testQuestion) => testQuestion.question
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f6]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className="mb-6 overflow-hidden rounded-2xl bg-[#7A1F2B] shadow-lg">
          <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <div className="mb-2 text-sm font-medium text-white/70">
                Результат тестування
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Деталі результату
              </h1>

              <p className="mt-2 text-sm text-white/75 sm:text-base">
                Перегляд результатів вашого тестування
              </p>
            </div>

            <Link
              href="/cabinet/results"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white hover:text-[#7A1F2B]"
            >
              ← До результатів
            </Link>
          </div>
        </header>

        {/* ТЕСТ */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7A1F2B]/10 text-xl">
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Кількість завдань
              </div>

              <div className="mt-1 font-semibold text-gray-900">
                {result.allowParticipantDetails
                  ? questions.length
                  : "Приховано"}
              </div>
            </div>
          </div>
        </section>

        {/* ЧАС */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl">
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
                {formatDuration(result.timeSpent)}
              </div>
            </div>
          </div>
        </section>

        {/* РЕЗУЛЬТАТ */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7A1F2B]/10 text-xl">
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
            <div className="rounded-xl bg-gray-50 p-5 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Бали
              </div>

              <div className="mt-2 text-2xl font-bold text-[#7A1F2B]">
                {result.earnedPoints} / {result.maxPoints}
              </div>
            </div>

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

            <div className="rounded-xl bg-green-50 p-5 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-green-700/60">
                Правильні
              </div>

              <div className="mt-2 text-2xl font-bold text-green-600">
                {result.correct}
              </div>
            </div>

            <div className="rounded-xl bg-red-50 p-5 text-center">
              <div className="text-xs font-medium uppercase tracking-wide text-red-700/60">
                Неправильні
              </div>

              <div className="mt-2 text-2xl font-bold text-red-600">
                {result.incorrect}
              </div>
            </div>

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

        {/* ПРИЧИНА ЗАВЕРШЕННЯ */}
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
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${finishReason.className}`}
            >
              <span className="font-bold">
                {finishReason.icon}
              </span>

              {finishReason.label}
            </span>
          </div>
        </section>

        {/* ЗАВДАННЯ АБО БЛОКУВАННЯ */}
        {!result.allowParticipantDetails ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
                🔒
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                Перегляд завдань недоступний
              </h2>

              <p className="mt-3 max-w-xl text-gray-500">
                Адміністратор заборонив перегляд завдань тестування
              </p>
            </div>
          </section>
        ) : (
          /* ЖУРНАЛ ВІДПОВІДЕЙ */
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-7">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7A1F2B]/10 text-xl">
                  📋
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Журнал відповідей
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Детальний перегляд усіх завдань та відповідей
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => {
                const selectedAnswers = getSavedAnswer(
                  result.answers,
                  question.id
                );

                const isMatching =
                  question.type === "matching";

                /* MATCHING */
                if (isMatching) {
                  const {
                    leftItems,
                    rightItems,
                  } = getMatchingData(question);

                  const {
                    correctPairs,
                    totalPairs,
                  } = getMatchingCorrectPairs(
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
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                    >
                      <div className="bg-gray-50 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7A1F2B] font-bold text-white">
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
                            className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${status.className}`}
                          >
                            <span className="font-bold">
                              {status.icon}
                            </span>

                            {status.label}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6">
                        <div className="mb-7">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Умова
                          </div>

                          <HtmlContent
                            html={question.text}
                            className="text-lg leading-8 text-gray-900"
                          />
                        </div>

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
                                      (right) =>
                                        right.id ===
                                        selectedRightId
                                    );

                                  const correctRight =
                                    rightItems.find(
                                      (right) =>
                                        right.id ===
                                        leftItem.correctRightId
                                    );

                                  return (
                                    <div
                                      key={
                                        leftItem.id
                                      }
                                      className={`grid gap-4 border-b border-gray-200 p-4 last:border-b-0 sm:grid-cols-[1fr_auto_1fr] sm:items-center ${
                                        correct
                                          ? "bg-green-50/60"
                                          : "bg-red-50/40"
                                      }`}
                                    >
                                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                                          Ліва частина
                                        </div>

                                        <HtmlContent
                                          html={
                                            leftItem.text
                                          }
                                          className="font-medium text-gray-900"
                                        />
                                      </div>

                                      <div
                                        className={`hidden text-xl font-bold sm:block ${
                                          correct
                                            ? "text-green-500"
                                            : "text-red-500"
                                        }`}
                                      >
                                        →
                                      </div>

                                      <div
                                        className={`rounded-lg border p-3 ${
                                          correct
                                            ? "border-green-200 bg-green-100"
                                            : "border-red-200 bg-red-100"
                                        }`}
                                      >
                                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                                          Відповідь учасника
                                        </div>

                                        <HtmlContent
                                          html={
                                            selectedRight
                                              ? selectedRight.text
                                              : "Без відповіді"
                                          }
                                          className={`font-medium ${
                                            correct
                                              ? "text-green-800"
                                              : "text-red-800"
                                          }`}
                                        />

                                        {!correct &&
                                          correctRight && (
                                            <div className="mt-3 border-t border-red-200 pt-2">
                                              <div className="text-xs font-medium text-gray-500">
                                                Правильна відповідність
                                              </div>

                                              <HtmlContent
                                                html={
                                                  correctRight.text
                                                }
                                                className="mt-1 text-sm font-semibold text-green-700"
                                              />
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
                                className={`text-2xl font-bold ${
                                  correctPairs ===
                                  totalPairs
                                    ? "text-green-600"
                                    : correctPairs > 0
                                    ? "text-orange-600"
                                    : "text-red-600"
                                }`}
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

                /* ЗВИЧАЙНЕ ПИТАННЯ */
                const status = getQuestionStatus(
                  question,
                  selectedAnswers
                );

                const correctOptions =
                  question.answerOptions.filter(
                    (option) => option.isCorrect
                  );

                const selectedOptions =
                  question.answerOptions.filter(
                    (option) =>
                      selectedAnswers.includes(
                        option.id
                      )
                  );

                return (
                  <article
                    key={question.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                  >
                    <div className="bg-gray-50 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7A1F2B] font-bold text-white">
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
                          className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${status.className}`}
                        >
                          <span className="font-bold">
                            {status.icon}
                          </span>

                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="mb-7">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Умова
                        </div>

                        <HtmlContent
                          html={question.text}
                          className="text-lg leading-8 text-gray-900"
                        />
                      </div>

                      {question.answerOptions.length >
                        0 && (
                        <div>
                          <div className="mb-3 text-sm font-semibold text-gray-600">
                            Варіанти відповідей
                          </div>

                          <div className="space-y-3">
                            {question.answerOptions.map(
                              (option) => {
                                const selected =
                                  selectedAnswers.includes(
                                    option.id
                                  );

                                const correct =
                                  option.isCorrect;

                                let optionClass =
                                  "border-gray-200 bg-white";

                                if (
                                  correct &&
                                  selected
                                ) {
                                  optionClass =
                                    "border-green-300 bg-green-50";
                                } else if (correct) {
                                  optionClass =
                                    "border-green-200 bg-green-50/70";
                                } else if (selected) {
                                  optionClass =
                                    "border-red-300 bg-red-50";
                                }

                                return (
                                  <div
                                    key={option.id}
                                    className={`rounded-xl border p-4 transition ${optionClass}`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-bold text-gray-700">
                                        {String.fromCharCode(
                                          65 +
                                            option.order
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <HtmlContent
                                          html={
                                            option.text
                                          }
                                          className="text-base leading-7 text-gray-900"
                                        />

                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {selected && (
                                            <span className="rounded-full bg-[#7A1F2B] px-3 py-1 text-xs font-semibold text-white">
                                              Відповідь учасника
                                            </span>
                                          )}

                                          {correct && (
                                            <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
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

                      <div className="mt-6 border-t border-gray-200 pt-5">
                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="rounded-xl bg-gray-50 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Обрано
                            </div>

                            <div className="mt-2 font-semibold leading-6 text-gray-900">
                              {selectedOptions.length >
                              0
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
                              className={`mt-2 font-semibold leading-6 ${status.pointsClass}`}
                            >
                              {correctOptions.length >
                              0
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
              })}
            </div>
          </section>
        )}

        {/* НИЖНЯ КНОПКА */}
        <div className="mt-7 flex justify-center">
          <Link
            href="/cabinet/results"
            className="inline-flex items-center justify-center rounded-xl bg-[#7A1F2B] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#651923] hover:shadow-md"
          >
            ← Повернутися до результатів
          </Link>
        </div>

        <div className="py-8 text-center text-xs text-gray-400">
          Платформа комп’ютерного тестування
        </div>
      </div>
    </main>
  );
}