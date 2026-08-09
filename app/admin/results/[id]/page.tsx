import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

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
  const minutes = Math.floor(
    (seconds % 3600) / 60
  );
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(remainingSeconds).padStart(
    2,
    "0"
  )}`;
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
          "bg-green-100 text-green-800",
      };

    case "timeout":
      return {
        label: "Час вичерпано",
        className:
          "bg-orange-100 text-orange-800",
      };

    case "security":
      return {
        label: "Порушення правил",
        className:
          "bg-red-100 text-red-800",
      };

    default:
      return {
        label: reason || "Не вказано",
        className:
          "bg-gray-100 text-gray-800",
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

  const data = answers as Record<
    string,
    unknown
  >;

  const answer = data[String(questionId)];

  if (!Array.isArray(answer)) {
    return [];
  }

  return answer.filter(
    (value): value is number =>
      typeof value === "number"
  );
}
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
        "bg-gray-100 text-gray-600",
      pointsClass: "text-gray-500",
    };
  }

  const correctIds = question.options
    .filter((option) => option.isCorrect)
    .map((option) => option.id)
    .sort((a, b) => a - b);

  const selectedIds = [...selectedAnswers].sort(
    (a, b) => a - b
  );

  const isCorrect =
    correctIds.length === selectedIds.length &&
    correctIds.every(
      (id, index) =>
        id === selectedIds[index]
    );

  if (isCorrect) {
    return {
      label: "Правильно",
      className:
        "bg-green-100 text-green-700",
      pointsClass: "text-green-600",
    };
  }

  return {
    label: "Неправильно",
    className:
      "bg-red-100 text-red-700",
    pointsClass: "text-red-600",
  };
}
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
    getFinishReason(result.finishReason);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Верхня панель */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#7A1F2B]">
              Деталі результату
            </h1>

            <p className="mt-2 text-gray-600">
              Повна інформація про
              проходження тестування.
            </p>
          </div>

          <Link
            href="/admin/results"
            className="
              inline-flex
              items-center
              justify-center
              rounded-lg
              border
              border-[#7A1F2B]
              bg-white
              px-5
              py-3
              font-semibold
              text-[#7A1F2B]
              transition
              hover:bg-[#7A1F2B]
              hover:text-white
            "
          >
            ← До журналу
          </Link>
        </div>

        {/* Інформація про учасника */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Учасник
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">
                ПІБ
              </div>

              <div className="mt-1 text-lg font-semibold">
                {participantName}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Код учасника
              </div>

              <div className="mt-1">
                {result.accessCode ? (
                  <span className="rounded-md bg-gray-100 px-3 py-1 font-mono text-lg">
                    {result.accessCode}
                  </span>
                ) : (
                  <span className="text-gray-500">
                    —
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Інформація про тест */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Тестування
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">
                Назва тесту
              </div>

              <div className="mt-1 text-lg font-semibold">
                {result.test.title}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Предмет
              </div>

              <div className="mt-1 text-lg font-semibold">
                {result.test.subject}
              </div>
            </div>
          </div>
        </section>

        {/* Час */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Час проходження
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm text-gray-500">
                Початок
              </div>

              <div className="mt-1 font-semibold">
                {formatDate(
                  result.startedAt
                )}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm text-gray-500">
                Завершення
              </div>

              <div className="mt-1 font-semibold">
                {formatDate(
                  result.finishedAt
                )}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm text-gray-500">
                Витрачено часу
              </div>

              <div className="mt-1 font-mono text-lg font-bold">
                {formatDuration(
                  result.timeSpent
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Результат */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Результат
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="text-sm text-gray-500">
                Бали
              </div>

              <div className="mt-2 text-2xl font-bold text-[#7A1F2B]">
                {result.earnedPoints} /{" "}
                {result.maxPoints}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="text-sm text-gray-500">
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

            <div className="rounded-lg bg-green-50 p-4 text-center">
              <div className="text-sm text-gray-500">
                Правильні
              </div>

              <div className="mt-2 text-2xl font-bold text-green-600">
                {result.correct}
              </div>
            </div>

            <div className="rounded-lg bg-red-50 p-4 text-center">
              <div className="text-sm text-gray-500">
                Неправильні
              </div>

              <div className="mt-2 text-2xl font-bold text-red-600">
                {result.incorrect}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="text-sm text-gray-500">
                Пропущені
              </div>

              <div className="mt-2 text-2xl font-bold text-gray-500">
                {result.skipped}
              </div>
            </div>
          </div>
        </section>

        {/* Причина завершення */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Завершення тестування
          </h2>

          <div>
            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${finishReason.className}`}
            >
              {finishReason.label}
            </span>
          </div>
        </section>

        {/* Журнал відповідей */}
<section className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-[#7A1F2B]">
      Журнал відповідей
    </h2>

    <p className="mt-2 text-sm text-gray-500">
      Детальний перегляд виконання кожного
      завдання учасником.
    </p>
  </div>

  <div className="space-y-5">
    {result.test.questions.map(
      (question, index) => {
        const selectedAnswers =
          getSavedAnswer(
            result.answers,
            question.id
          );

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
            className="overflow-hidden rounded-xl border border-gray-200"
          >
            {/* Заголовок завдання */}
            <div className="flex flex-col gap-3 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="
                    flex
                    h-10
                    w-10
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
                  <div className="text-sm text-gray-500">
                    Завдання {index + 1}
                  </div>

                  <div className="font-semibold">
                    {question.points}{" "}
                    {question.points === 1
                      ? "бал"
                      : "бали"}
                  </div>
                </div>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            {/* Текст завдання */}
            <div className="p-5">
              <div className="mb-5">
                <div className="mb-2 text-sm font-medium text-gray-500">
                  Умова
                </div>

                <div className="text-lg leading-7">
                  {question.text}
                </div>
              </div>

              {/* Варіанти */}
              {question.options.length > 0 && (
                <div>
                  <div className="mb-3 text-sm font-medium text-gray-500">
                    Варіанти відповідей
                  </div>

                  <div className="space-y-2">
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
                            "border-green-300 bg-green-50";
                        } else if (
                          selected
                        ) {
                          className =
                            "border-red-300 bg-red-50";
                        }

                        return (
                          <div
                            key={option.id}
                            className={`rounded-lg border p-4 ${className}`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="
                                  mt-0.5
                                  flex
                                  h-6
                                  w-6
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  border
                                  border-gray-300
                                  text-xs
                                  font-bold
                                "
                              >
                                {String.fromCharCode(
                                  65 +
                                    option.order
                                )}
                              </div>

                              <div className="flex-1">
                                <div>
                                  {option.text}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {selected && (
                                    <span className="rounded-full bg-[#7A1F2B] px-2.5 py-1 text-xs font-semibold text-white">
                                      Відповідь учасника
                                    </span>
                                  )}

                                  {correct && (
                                    <span className="rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">
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

              {/* Підсумок завдання */}
              <div className="mt-5 border-t border-gray-200 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm text-gray-500">
                      Обрано
                    </div>

                    <div className="mt-1 font-semibold">
                      {selectedOptions.length > 0
                        ? selectedOptions
                            .map(
                              (option) =>
                                option.text
                            )
                            .join(", ")
                        : "Без відповіді"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">
                      Правильна відповідь
                    </div>

                    <div
                      className={`mt-1 font-semibold ${status.pointsClass}`}
                    >
                      {correctOptions.length >
                      0
                        ? correctOptions
                            .map(
                              (option) =>
                                option.text
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

        {/* Нижня кнопка */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/admin/results"
            className="
              rounded-lg
              bg-[#7A1F2B]
              px-6
              py-3
              font-semibold
              text-white
              transition
              hover:bg-[#651923]
            "
          >
            Повернутися до журналу
          </Link>
        </div>
      </div>
    </main>
  );
}