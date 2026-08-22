import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

import MonitoringControls from "./MonitoringControls";
import MonitoringSessionState from "./MonitoringSessionState";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

// =====================================================
// ФОРМАТУВАННЯ ДАТИ
// =====================================================

function formatDate(date: Date | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("uk-UA", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

// =====================================================
// ПІБ УЧАСНИКА
// =====================================================

function getParticipantName(
  participant: {
    lastName: string;
    firstName: string;
    middleName: string | null;
  } | null
) {
  if (!participant) {
    return "Не вказано";
  }

  return [
    participant.lastName,
    participant.firstName,
    participant.middleName,
  ]
    .filter(Boolean)
    .join(" ");
}

// =====================================================
// ПЕРЕВІРКА, ЧИ Є ВІДПОВІДЬ
//
// savedAnswers у TestSession має тип Json.
//
// У різних частинах платформи відповіді можуть
// зберігатися як об'єкт:
//
// {
//   "0": "2",
//   "1": "1"
// }
//
// або:
//
// {
//   "0": ["1", "3"]
// }
//
// Тому тут не перевіряємо конкретний тип відповіді,
// а лише визначаємо, чи ключ питання присутній
// і чи значення не є порожнім.
// =====================================================

function hasAnswer(
  savedAnswers: unknown,
  questionIndex: number
): boolean {
  if (
    !savedAnswers ||
    typeof savedAnswers !== "object" ||
    Array.isArray(savedAnswers)
  ) {
    return false;
  }

  const answers =
    savedAnswers as Record<
      string,
      unknown
    >;

  const value =
    answers[String(questionIndex)];

  if (value === undefined) {
    return false;
  }

  if (value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

// =====================================================
// СТОРІНКА ДЕТАЛЕЙ СЕСІЇ
// =====================================================

export default async function MonitoringDetailsPage({
  params,
}: Props) {
  // ===================================================
  // ID СЕСІЇ
  // ===================================================

  const { id } = await params;

  const sessionId = Number(id);

  if (
    !Number.isInteger(sessionId) ||
    sessionId <= 0
  ) {
    notFound();
  }

  // ===================================================
  // ЗАВАНТАЖЕННЯ СЕСІЇ
  // ===================================================

  const session =
    await prisma.testSession.findUnique({
      where: {
        id: sessionId,
      },

      include: {
        participant: true,

        test: {
          select: {
            id: true,
            title: true,
            subject: true,
            duration: true,

            questions: {
              orderBy: {
                order: "asc",
              },

              select: {
                id: true,
                order: true,

                question: {
                  select: {
                    id: true,
                    text: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  // ===================================================
  // СЕСІЮ НЕ ЗНАЙДЕНО
  // ===================================================

  if (!session) {
    notFound();
  }

  // ===================================================
  // ПІБ
  // ===================================================

  const participantName =
    getParticipantName(
      session.participant
    );

  // ===================================================
  // КІЛЬКІСТЬ ПИТАНЬ
  // ===================================================

  const questions =
    session.test.questions;

  const totalQuestions =
    questions.length;

  // ===================================================
  // ЗБЕРЕЖЕНІ ВІДПОВІДІ
  // ===================================================

  const savedAnswers =
    session.savedAnswers;

  // ===================================================
  // КІЛЬКІСТЬ ВІДПОВІДАНИХ ПИТАНЬ
  // ===================================================

  const answeredCount =
    questions.filter(
      (_, index) =>
        hasAnswer(
          savedAnswers,
          index
        )
    ).length;

  // ===================================================
  // ПОТОЧНЕ ПИТАННЯ
  //
  // currentQuestion у системі зберігається
  // з нуля:
  //
  // 0 = питання №1
  // 1 = питання №2
  // ===================================================

  const currentQuestion =
    Math.max(
      0,
      session.currentQuestion
    );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">

        {/* =================================================
            ВЕРХНЯ ПАНЕЛЬ
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#7A1F2B]">
              Керування тестуванням
            </h1>

            <p className="mt-2 text-gray-600">
              Моніторинг конкретної сесії
              тестування.
            </p>
          </div>

          <Link
            href="/admin/monitoring"
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
            ← До моніторингу
          </Link>
        </div>

        {/* =================================================
            СТАТУС
        ================================================= */}

        <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Статус тестування
          </h2>

          {session.blocked ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="text-xl font-bold text-red-700">
                Тестування заблоковано
              </div>

              {session.blockReason && (
                <p className="mt-2 text-red-600">
                  Причина:{" "}
                  {session.blockReason}
                </p>
              )}

              {session.blockedAt && (
                <p className="mt-2 text-sm text-red-500">
                  Час блокування:{" "}
                  {formatDate(
                    session.blockedAt
                  )}
                </p>
              )}
            </div>
          ) : session.finished ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="text-xl font-bold text-gray-700">
                Тестування завершено
              </div>

              {session.finishedAt && (
                <p className="mt-2 text-gray-600">
                  Час завершення:{" "}
                  {formatDate(
                    session.finishedAt
                  )}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="text-xl font-bold text-green-700">
                Тестування активне
              </div>

              <p className="mt-2 text-green-600">
                Учасник наразі проходить
                тестування.
              </p>
            </div>
          )}
        </section>

        {/* =================================================
            УЧАСНИК
        ================================================= */}

        <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Учасник
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">
                ПІБ
              </div>

              <div className="mt-1 text-xl font-semibold">
                {participantName}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                ID сесії
              </div>

              <div className="mt-1 font-mono text-lg font-semibold">
                {session.id}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ТЕСТ
        ================================================= */}

        <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Тест
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">
                Назва
              </div>

              <div className="mt-1 text-lg font-semibold">
                {session.test.title}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">
                Предмет
              </div>

              <div className="mt-1 text-lg font-semibold">
                {session.test.subject}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ПОТОЧНЕ ПИТАННЯ
        ================================================= */}

        <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-[#7A1F2B]">
              Поточне питання
            </h2>

            <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
              Відповіді:{" "}
              <span className="text-[#7A1F2B]">
                {answeredCount}
              </span>
              {" / "}
              {totalQuestions}
            </div>
          </div>

          {/* =================================================
              ПОТОЧНЕ ПИТАННЯ
          ================================================= */}

          <div className="mb-4 rounded-xl border-2 border-[#7A1F2B] bg-[#fff8f9] p-5">
            <div className="text-sm font-semibold text-[#7A1F2B]">
              Поточне питання
            </div>

            <div className="mt-1 text-2xl font-bold text-gray-800">
              Питання №{" "}
              {Math.min(
                currentQuestion + 1,
                Math.max(
                  1,
                  totalQuestions
                )
              )}
            </div>

            {questions[
              currentQuestion
            ] && (
              <p className="mt-3 text-gray-700">
                {
                  questions[
                    currentQuestion
                  ].question.text
                }
              </p>
            )}
          </div>

          {/* =================================================
              РОЗГОРТНИЙ СПИСОК ПИТАНЬ
          ================================================= */}

          <details className="overflow-hidden rounded-xl border border-gray-200">
            <summary
              className="
                cursor-pointer
                select-none
                bg-gray-50
                px-5
                py-4
                font-semibold
                text-gray-800
                transition
                hover:bg-gray-100
              "
            >
              Переглянути всі питання
            </summary>

            <div className="border-t border-gray-200 bg-white p-3">
              {questions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  У цьому тесті немає питань.
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map(
                    (
                      testQuestion,
                      index
                    ) => {
                      const isCurrent =
                        index ===
                        currentQuestion;

                      const answered =
                        hasAnswer(
                          savedAnswers,
                          index
                        );

                      return (
                        <div
                          key={
                            testQuestion.id
                          }
                          className={`
                            flex
                            items-center
                            gap-3
                            rounded-lg
                            border
                            px-4
                            py-3
                            transition
                            ${
                              isCurrent
                                ? "border-[#7A1F2B] bg-[#fff1f3]"
                                : "border-gray-200 bg-white"
                            }
                          `}
                        >
                          {/* Номер */}

                          <div
                            className={`
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              text-sm
                              font-bold
                              ${
                                isCurrent
                                  ? "bg-[#7A1F2B] text-white"
                                  : "bg-gray-100 text-gray-700"
                              }
                            `}
                          >
                            {index + 1}
                          </div>

                          {/* Назва питання */}

                          <div className="min-w-0 flex-1">
                            <div
                              className={`
                                font-semibold
                                ${
                                  isCurrent
                                    ? "text-[#7A1F2B]"
                                    : "text-gray-800"
                                }
                              `}
                            >
                              Питання №{" "}
                              {index + 1}
                            </div>

                            <div className="mt-1 truncate text-sm text-gray-500">
                              {
                                testQuestion
                                  .question
                                  .text
                              }
                            </div>
                          </div>

                          {/* Статус відповіді */}

                          <div className="shrink-0">
                            {answered ? (
                              <span
                                className="
                                  flex
                                  h-8
                                  w-8
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-green-100
                                  text-lg
                                  font-bold
                                  text-green-700
                                "
                                title="На питання вже надано відповідь"
                              >
                                ✓
                              </span>
                            ) : (
                              <span
                                className="
                                  flex
                                  h-8
                                  w-8
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-gray-100
                                  text-sm
                                  text-gray-400
                                "
                                title="Відповіді ще немає"
                              >
                                —
                              </span>
                            )}
                          </div>

                          {/* Позначка поточного */}

                          {isCurrent && (
                            <div className="shrink-0">
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
                                Поточне
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </details>
        </section>

        {/* =================================================
            ПОТОЧНИЙ СТАН — LIVE
        ================================================= */}

        <MonitoringSessionState
          testId={session.testId}
          sessionId={session.id}
          initialCurrentQuestion={
            session.currentQuestion
          }
          initialTimeLeft={
            session.timeLeft
          }
          initialExtraTime={
            session.extraTime
          }
          initialBlocked={
            session.blocked
          }
          initialBlockReason={
            session.blockReason
          }
          initialFinished={
            session.finished
          }
        />

        {/* =================================================
            ЧАС ТА АКТИВНІСТЬ
        ================================================= */}

        <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Час та активність
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm text-gray-500">
                Початок
              </div>

              <div className="mt-1 font-semibold">
                {formatDate(
                  session.startedAt
                )}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm text-gray-500">
                Остання активність
              </div>

              <div className="mt-1 font-semibold">
                {formatDate(
                  session.lastActivityAt
                )}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm text-gray-500">
                Завершення
              </div>

              <div className="mt-1 font-semibold">
                {formatDate(
                  session.finishedAt
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ПАНЕЛЬ КЕРУВАННЯ
        ================================================= */}

        <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Керування тестуванням
          </h2>

          <MonitoringControls
            sessionId={session.id}
            testId={session.testId}
            blocked={session.blocked}
          />
        </section>

        {/* =================================================
            НИЖНЯ КНОПКА
        ================================================= */}

        <div className="flex justify-center">
          <Link
            href="/admin/monitoring"
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
            Повернутися до моніторингу
          </Link>
        </div>
      </div>
    </main>
  );
}