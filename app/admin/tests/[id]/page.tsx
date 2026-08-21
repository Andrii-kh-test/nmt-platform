import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function cleanRichText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value !== "string") {
    return String(value);
  }

  let text = value.trim();

  if (!text) {
    return "";
  }

  if (
    (text.startsWith("{") && text.endsWith("}")) ||
    (text.startsWith("[") && text.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(text);

      const extractText = (node: unknown): string => {
        if (!node || typeof node !== "object") {
          return "";
        }

        const current = node as {
          text?: unknown;
          content?: unknown;
        };

        let result = "";

        if (typeof current.text === "string") {
          result += current.text;
        }

        if (Array.isArray(current.content)) {
          result += current.content
            .map(extractText)
            .join("");
        }

        return result;
      };

      const jsonText = extractText(parsed);

      if (jsonText.trim()) {
        return jsonText
          .replace(/\u00a0/g, " ")
          .replace(/[ \t]+/g, " ")
          .trim();
      }
    } catch {
      // Не JSON.
    }
  }

  text = text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\{\{[\s\S]*?\}\}/g, "")
    .replace(/\[\[([\s\S]*?)\]\]/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  return text;
}

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("uk-UA", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function getQuestionTypeLabel(type: string) {
  switch (type) {
    case "single":
    case "single-choice":
      return "Один варіант";

    case "multiple":
    case "multiple-choice":
      return "Кілька варіантів";

    case "text":
      return "Текстова відповідь";

    case "matching":
      return "Відповідність";

    case "sequence":
      return "Послідовність";

    default:
      return type || "Не вказано";
  }
}

export default async function AdminTestDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const testId = Number(id);

  if (!Number.isInteger(testId) || testId <= 0) {
    notFound();
  }

  const test = await prisma.test.findUnique({
    where: {
      id: testId,
    },

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

      sessions: {
        orderBy: {
          createdAt: "desc",
        },

        include: {
          participant: true,
          result: true,
        },
      },
    },
  });

  if (!test) {
    notFound();
  }

  const totalQuestions = test.questions.length;

  const totalPoints = test.questions.reduce(
    (sum, testQuestion) =>
      sum + testQuestion.question.points,
    0
  );

  const finishedSessions = test.sessions.filter(
    (session) => session.finished
  );

  const activeSessions = test.sessions.filter(
    (session) =>
      !session.finished && !session.blocked
  );

  const blockedSessions = test.sessions.filter(
    (session) => session.blocked
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-[1800px]">
        {/* ХЛІБНІ КРИХТИ */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/admin"
            className="hover:text-[#7A1F2B]"
          >
            Панель
          </Link>

          <span>→</span>

          <Link
            href="/admin/tests"
            className="hover:text-[#7A1F2B]"
          >
            Тести
          </Link>

          <span>→</span>

          <span className="text-gray-700">
            {test.title}
          </span>
        </div>

        {/* ЗАГОЛОВОК */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#7A1F2B]">
              {test.title}
            </h1>

            <p className="mt-2 text-lg text-gray-600">
              Детальна інформація про тест.
            </p>
          </div>

          <Link
            href="/admin/tests"
            className="
              inline-flex
              w-fit
              items-center
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-2
              font-medium
              text-gray-700
              shadow-sm
              transition
              hover:bg-gray-50
            "
          >
            ← До списку тестів
          </Link>
        </div>

        {/* ОСНОВНА ІНФОРМАЦІЯ */}
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-4">
            <div>
              <div className="text-sm font-medium text-gray-500">
                Назва
              </div>

              <div className="mt-1 text-lg font-semibold text-gray-900">
                {test.title}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">
                Предмет
              </div>

              <div className="mt-1 text-lg text-gray-900">
                {test.subject}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">
                Час
              </div>

              <div className="mt-1 text-lg text-gray-900">
                {test.duration} хв
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">
                Максимальний бал
              </div>

              <div className="mt-1 text-lg font-bold text-[#7A1F2B]">
                {test.maxPoints}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <span
              className={`
                rounded-full px-3 py-1 text-sm font-semibold
                ${
                  test.isPublished
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }
              `}
            >
              {test.isPublished
                ? "Опублікований"
                : "Чернетка"}
            </span>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {test.codeRequired
                ? "Потрібен код доступу"
                : "Код не потрібен"}
            </span>
          </div>

          {test.accessCode && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-500">
                Код доступу
              </div>

              <div className="mt-1 font-mono text-lg font-bold text-gray-900">
                {test.accessCode}
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-gray-500">
                Створено
              </div>

              <div className="mt-1 text-sm text-gray-800">
                {formatDate(test.createdAt)}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">
                Оновлено
              </div>

              <div className="mt-1 text-sm text-gray-800">
                {formatDate(test.updatedAt)}
              </div>
            </div>
          </div>
        </section>

        {/* СТАТИСТИКА */}
        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">
              Питань
            </div>

            <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
              {totalQuestions}
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">
              Балів
            </div>

            <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
              {totalPoints}
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">
              Усього сесій
            </div>

            <div className="mt-2 text-3xl font-bold text-gray-900">
              {test.sessions.length}
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">
              Завершені
            </div>

            <div className="mt-2 text-3xl font-bold text-green-600">
              {finishedSessions.length}
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">
              Активні / заблоковані
            </div>

            <div className="mt-2 text-3xl font-bold text-orange-600">
              {activeSessions.length} /{" "}
              {blockedSessions.length}
            </div>
          </div>
        </section>

        {/* ПИТАННЯ */}
        <section className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-6 py-5">
            <h2 className="text-2xl font-bold text-[#7A1F2B]">
              Завдання тесту
            </h2>

            <p className="mt-1 text-gray-600">
              Питання розташовані відповідно до
              поля TestQuestion.order.
            </p>
          </div>

          {test.questions.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              У тесті немає завдань.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {test.questions.map(
                (testQuestion, index) => {
                  const question =
                    testQuestion.question;

                  return (
                    <article
                      key={testQuestion.id}
                      className="p-6"
                    >
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#7A1F2B] px-3 text-sm font-bold text-white">
                          {index + 1}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                          {getQuestionTypeLabel(
                            question.type
                          )}
                        </span>

                        <span className="rounded-full bg-[#F3E8EA] px-3 py-1 text-sm font-semibold text-[#7A1F2B]">
                          {question.points}{" "}
                          {question.points === 1
                            ? "бал"
                            : "бали"}
                        </span>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Умова
                        </div>

                        <div className="whitespace-pre-wrap text-base leading-7 text-gray-900">
                          {cleanRichText(
                            question.text
                          ) ||
                            "Умова не задана."}
                        </div>
                      </div>

                      {question.answerOptions.length >
                        0 && (
                        <div className="mt-5">
                          <div className="mb-3 text-sm font-semibold text-gray-700">
                            Варіанти відповідей
                          </div>

                          <div className="space-y-2">
                            {question.answerOptions.map(
                              (
                                option,
                                optionIndex
                              ) => (
                                <div
                                  key={option.id}
                                  className={`
                                    flex
                                    items-start
                                    gap-3
                                    rounded-lg
                                    border
                                    p-3
                                    ${
                                      option.isCorrect
                                        ? "border-green-300 bg-green-50"
                                        : "border-gray-200 bg-white"
                                    }
                                  `}
                                >
                                  <span
                                    className={`
                                      flex
                                      h-7
                                      w-7
                                      shrink-0
                                      items-center
                                      justify-center
                                      rounded-full
                                      text-xs
                                      font-bold
                                      ${
                                        option.isCorrect
                                          ? "bg-green-600 text-white"
                                          : "bg-gray-200 text-gray-700"
                                      }
                                    `}
                                  >
                                    {String.fromCharCode(
                                      65 + optionIndex
                                    )}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <div className="whitespace-pre-wrap text-sm leading-6 text-gray-800">
                                      {cleanRichText(
                                        option.text
                                      ) ||
                                        "Варіант без тексту."}
                                    </div>

                                    {option.isCorrect && (
                                      <div className="mt-1 text-xs font-semibold text-green-700">
                                        Правильна відповідь
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* СЕСІЇ */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-6 py-5">
            <h2 className="text-2xl font-bold text-[#7A1F2B]">
              Сесії тестування
            </h2>
          </div>

          {test.sessions.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Сесій для цього тесту поки немає.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-[#7A1F2B] text-white">
                  <tr>
                    <th className="p-4 text-left">
                      №
                    </th>

                    <th className="p-4 text-left">
                      Учасник
                    </th>

                    <th className="p-4 text-left">
                      Статус
                    </th>

                    <th className="p-4 text-left">
                      Початок
                    </th>

                    <th className="p-4 text-left">
                      Завершення
                    </th>

                    <th className="p-4 text-left">
                      Результат
                    </th>

                    <th className="p-4 text-left">
                      Дія
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {test.sessions.map(
                    (session, index) => {
                      const participant =
                        session.participant;

                      const participantName =
                        participant
                          ? [
                              participant.lastName,
                              participant.firstName,
                              participant.middleName,
                            ]
                              .filter(Boolean)
                              .join(" ")
                          : "Не вказано";

                      return (
                        <tr
                          key={session.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-4">
                            {index + 1}
                          </td>

                          <td className="p-4 font-medium text-gray-900">
                            {participantName}
                          </td>

                          <td className="p-4">
                            <span
                              className={`
                                rounded-full
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                ${
                                  session.finished
                                    ? "bg-green-100 text-green-700"
                                    : session.blocked
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                                }
                              `}
                            >
                              {session.finished
                                ? "Завершена"
                                : session.blocked
                                ? "Заблокована"
                                : "Активна"}
                            </span>
                          </td>

                          <td className="p-4 text-sm text-gray-600">
                            {formatDate(
                              session.startedAt
                            )}
                          </td>

                          <td className="p-4 text-sm text-gray-600">
                            {formatDate(
                              session.finishedAt
                            )}
                          </td>

                          <td className="p-4">
                            {session.result ? (
                              <span className="font-semibold text-[#7A1F2B]">
                                {
                                  session.result
                                    .earnedPoints
                                }{" "}
                                /{" "}
                                {
                                  session.result
                                    .maxPoints
                                }
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="p-4">
                            <Link
                              href={`/admin/monitoring/${session.id}`}
                              className="font-semibold text-[#7A1F2B] hover:underline"
                            >
                              Переглянути
                            </Link>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}