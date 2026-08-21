import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Очищення технічної розмітки з тексту.
 *
 * Підтримує:
 * - звичайний текст;
 * - HTML;
 * - Tiptap HTML;
 * - JSON-рядок Tiptap/ProseMirror.
 */
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

  /*
   * Якщо це JSON Tiptap/ProseMirror,
   * витягуємо текст рекурсивно.
   */
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
            .map((child) => extractText(child))
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
      // Якщо це не JSON — продовжуємо як HTML/текст.
    }
  }

  /*
   * HTML-коментарі.
   */
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  /*
   * HTML-розділювачі.
   */
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n");

  /*
   * HTML-теги.
   */
  text = text.replace(/<[^>]*>/g, "");

  /*
   * Базові HTML entities.
   */
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  /*
   * Службові маркери.
   */
  text = text
    .replace(/\{\{[\s\S]*?\}\}/g, "")
    .replace(/\[\[([\s\S]*?)\]\]/g, "$1");

  /*
   * Зайві пробіли.
   */
  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  return text;
}

/**
 * Форматування дати українською.
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("uk-UA", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

/**
 * Статус тестової сесії.
 */
function getSessionStatus(session: {
  finished: boolean;
  blocked: boolean;
}) {
  if (session.finished) {
    return {
      label: "Завершена",
      className: "bg-green-100 text-green-700",
    };
  }

  if (session.blocked) {
    return {
      label: "Заблокована",
      className: "bg-red-100 text-red-700",
    };
  }

  return {
    label: "Активна",
    className: "bg-orange-100 text-orange-700",
  };
}

/**
 * Назва типу питання.
 */
function getQuestionTypeLabel(type: string): string {
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

export default async function AdminUserDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const participantId = Number(id);

  if (!Number.isInteger(participantId) || participantId <= 0) {
    notFound();
  }

  /*
   * Актуальна структура Prisma:
   *
   * Participant
   *   └── sessions
   *       └── test
   *           └── questions
   *               └── question
   *                   └── answerOptions
   */
  const participant = await prisma.participant.findUnique({
    where: {
      id: participantId,
    },

    include: {
      sessions: {
        orderBy: {
          createdAt: "desc",
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
      },
    },
  });

  if (!participant) {
    notFound();
  }

  const fullName = [
    participant.lastName,
    participant.firstName,
    participant.middleName,
  ]
    .filter(Boolean)
    .join(" ");

  const finishedSessions = participant.sessions.filter(
    (session) => session.finished
  );

  const activeSessions = participant.sessions.filter(
    (session) => !session.finished && !session.blocked
  );

  const blockedSessions = participant.sessions.filter(
    (session) => session.blocked
  );

  return (
    <div>
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
          href="/admin/users"
          className="hover:text-[#7A1F2B]"
        >
          Користувачі
        </Link>

        <span>→</span>

        <span className="text-gray-700">
          {fullName}
        </span>
      </div>

      {/* ЗАГОЛОВОК */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-4xl font-bold text-[#7A1F2B]">
            {fullName}
          </h2>

          <p className="mt-2 text-lg text-gray-600">
            Детальна інформація про учасника
            платформи тестування.
          </p>
        </div>

        <Link
          href="/admin/users"
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
          ← До списку
        </Link>
      </div>

      {/* ОСНОВНА ІНФОРМАЦІЯ */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center gap-4">
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-[#F3E8EA]
                text-3xl
              "
            >
              👤
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {fullName}
              </h3>

              <p className="text-gray-500">
                Учасник №{participant.id}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-gray-500">
                Прізвище
              </div>

              <div className="mt-1 text-lg text-gray-900">
                {participant.lastName}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">
                Ім’я
              </div>

              <div className="mt-1 text-lg text-gray-900">
                {participant.firstName}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">
                По батькові
              </div>

              <div className="mt-1 text-lg text-gray-900">
                {participant.middleName || "—"}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">
                Код доступу
              </div>

              <div className="mt-1 text-lg text-gray-900">
                {participant.accessCode || "—"}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">
                Зареєстрований
              </div>

              <div className="mt-1 text-lg text-gray-900">
                {formatDate(participant.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* СТАТИСТИКА */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-xl font-bold text-gray-900">
            Статистика
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Усього сесій
              </span>

              <span className="font-bold text-gray-900">
                {participant.sessions.length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Завершені
              </span>

              <span className="font-bold text-green-700">
                {finishedSessions.length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Активні
              </span>

              <span className="font-bold text-orange-600">
                {activeSessions.length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Заблоковані
              </span>

              <span className="font-bold text-red-600">
                {blockedSessions.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* СЕСІЇ */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b bg-gray-50 px-6 py-5">
          <h3 className="text-2xl font-bold text-[#7A1F2B]">
            Сесії тестування
          </h3>

          <p className="mt-1 text-gray-600">
            Усі тестові сесії цього учасника.
          </p>
        </div>

        {participant.sessions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl">📋</div>

            <h4 className="mt-4 text-xl font-semibold text-gray-800">
              Сесій поки немає
            </h4>

            <p className="mt-2 text-gray-500">
              Цей учасник ще не розпочинав
              тестування.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {participant.sessions.map((session) => {
              const status = getSessionStatus(session);

              return (
                <div
                  key={session.id}
                  className="p-6 transition hover:bg-gray-50"
                >
                  {/* ОСНОВНА ІНФОРМАЦІЯ */}
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">
                          Сесія #{session.id}
                        </span>

                        <span
                          className={`
                            inline-flex
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            ${status.className}
                          `}
                        >
                          {status.label}
                        </span>
                      </div>

                      <h4 className="text-xl font-bold text-gray-900">
                        {session.test.title}
                      </h4>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                        <span>
                          Предмет:{" "}
                          <strong className="text-gray-700">
                            {session.test.subject}
                          </strong>
                        </span>

                        <span>
                          Питань:{" "}
                          <strong className="text-gray-700">
                            {session.test.questions.length}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* ПОКАЗНИКИ */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:w-auto">
                      <div>
                        <div className="text-xs text-gray-500">
                          Питання
                        </div>

                        <div className="mt-1 text-lg font-bold text-gray-900">
                          {session.test.questions.length}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500">
                          Час
                        </div>

                        <div className="mt-1 text-lg font-bold text-gray-900">
                          {session.test.duration} хв
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500">
                          Додатковий час
                        </div>

                        <div className="mt-1 text-lg font-bold text-gray-900">
                          {Math.floor(session.extraTime / 60)} хв
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500">
                          Блокування
                        </div>

                        <div className="mt-1 text-lg font-bold text-gray-900">
                          {session.blocked ? "Так" : "Ні"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ДЕТАЛІ СЕСІЇ */}
                  <div className="mt-5 grid gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Початок
                      </div>

                      <div className="mt-1 text-sm text-gray-800">
                        {formatDate(session.startedAt)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Остання активність
                      </div>

                      <div className="mt-1 text-sm text-gray-800">
                        {formatDate(session.lastActivityAt)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Завершення
                      </div>

                      <div className="mt-1 text-sm text-gray-800">
                        {formatDate(session.finishedAt)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Створено
                      </div>

                      <div className="mt-1 text-sm text-gray-800">
                        {formatDate(session.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* БЛОКУВАННЯ */}
                  {session.blocked &&
                    session.blockReason && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="font-semibold text-red-800">
                          Причина блокування
                        </div>

                        <div className="mt-1 text-sm text-red-700">
                          {session.blockReason}
                        </div>

                        {session.blockedAt && (
                          <div className="mt-2 text-xs text-red-600">
                            Заблоковано:{" "}
                            {formatDate(session.blockedAt)}
                          </div>
                        )}
                      </div>
                    )}

                  {/* ПИТАННЯ ТЕСТУ */}
                  <div className="mt-6 rounded-xl border border-gray-200 bg-white">
                    <div className="border-b bg-gray-50 px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h5 className="text-lg font-bold text-[#7A1F2B]">
                            Завдання тесту
                          </h5>

                          <p className="mt-1 text-sm text-gray-500">
                            Питання та варіанти
                            відповідей.
                          </p>
                        </div>

                        <span className="rounded-full bg-[#F3E8EA] px-3 py-1 text-sm font-semibold text-[#7A1F2B]">
                          {session.test.questions.length}{" "}
                          завдань
                        </span>
                      </div>
                    </div>

                    {session.test.questions.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        У цьому тесті немає завдань.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {session.test.questions.map(
                          (testQuestion, questionIndex) => {
                            const question =
                              testQuestion.question;

                            return (
                              <div
                                key={testQuestion.id}
                                className="p-5"
                              >
                                {/* Номер */}
                                <div className="mb-3 flex flex-wrap items-center gap-3">
                                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#7A1F2B] px-2 text-sm font-bold text-white">
                                    {questionIndex + 1}
                                  </span>

                                  <span className="text-sm text-gray-500">
                                    Тип:{" "}
                                    <strong className="text-gray-700">
                                      {getQuestionTypeLabel(
                                        question.type
                                      )}
                                    </strong>
                                  </span>

                                  <span className="text-sm text-gray-500">
                                    Балів:{" "}
                                    <strong className="text-gray-700">
                                      {question.points}
                                    </strong>
                                  </span>
                                </div>

                                {/* Умова */}
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Умова завдання
                                  </div>

                                  <div className="whitespace-pre-wrap text-base leading-7 text-gray-900">
                                    {cleanRichText(
                                      question.text
                                    ) ||
                                      "Умова не задана."}
                                  </div>
                                </div>

                                {/* Варіанти */}
                                {question.answerOptions.length >
                                  0 && (
                                  <div className="mt-4">
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>

                  {/* ПОСИЛАННЯ */}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/tests/${session.testId}`}
                      className="
                        inline-flex
                        items-center
                        rounded-lg
                        border
                        border-[#7A1F2B]
                        px-4
                        py-2
                        text-sm
                        font-semibold
                        text-[#7A1F2B]
                        transition
                        hover:bg-[#F3E8EA]
                      "
                    >
                      Переглянути тест
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ПРИМІТКА */}
      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="font-semibold text-blue-900">
          Примітка щодо результатів
        </div>

        <p className="mt-1 text-sm leading-6 text-blue-800">
          Результати тестування зберігаються в
          таблиці TestResult і прив’язані до
          конкретної тестової сесії через sessionId.
          Тому для отримання результату учасника
          можна використовувати зв’язок
          TestSession → TestResult.
        </p>
      </div>
    </div>
  );
}