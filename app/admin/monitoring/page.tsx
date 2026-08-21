import Link from "next/link";

import { prisma } from "@/app/lib/prisma";
import MonitoringRefresh from "./MonitoringRefresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const INACTIVITY_TIMEOUT = 90;

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
// ФОРМАТУВАННЯ ЧАСУ
// =====================================================

function formatTime(seconds: number) {
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

// =====================================================
// РОЗРАХУНОК АКТУАЛЬНОГО ЗАЛИШКУ ЧАСУ
//
// Не покладаємося тільки на session.timeLeft,
// оскільки це значення не обов'язково записується
// в БД щосекунди.
//
// Рахуємо:
//
// duration * 60
// + extraTime
// - час від початку
// =====================================================

function getCurrentTimeLeft(session: {
  startedAt: Date;
  timeLeft: number;
  extraTime: number;
  test: {
    duration: number;
  };
}) {
  const baseTime =
    Math.max(
      0,
      Math.floor(
        session.test.duration * 60
      )
    );

  const extraTime =
    Math.max(
      0,
      Math.floor(session.extraTime)
    );

  const startedAt =
    new Date(
      session.startedAt
    ).getTime();

  const elapsedSeconds =
    Math.max(
      0,
      Math.floor(
        (Date.now() - startedAt) /
          1000
      )
    );

  const calculatedTimeLeft =
    Math.max(
      0,
      baseTime +
        extraTime -
        elapsedSeconds
    );

  // Якщо серверне timeLeft менше за розраховане,
  // використовуємо менше значення.
  //
  // Це захищає від ситуації, коли timeLeft уже
  // було зменшено іншою серверною логікою.
  if (
    session.timeLeft >= 0 &&
    session.timeLeft <
      calculatedTimeLeft
  ) {
    return session.timeLeft;
  }

  return calculatedTimeLeft;
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
// СТАТУС СЕСІЇ
// =====================================================

function getStatus(session: {
  blocked: boolean;
  blockReason: string | null;
  finished: boolean;
  lastActivityAt: Date;
}) {
  // ---------------------------------------------------
  // Заблоковано
  // ---------------------------------------------------

  if (session.blocked) {
    return {
      label: "Заблоковано",
      className:
        "bg-red-100 text-red-800",
    };
  }

  // ---------------------------------------------------
  // Завершено
  // ---------------------------------------------------

  if (session.finished) {
    return {
      label: "Завершено",
      className:
        "bg-gray-100 text-gray-800",
    };
  }

  // ---------------------------------------------------
  // Час останньої активності
  // ---------------------------------------------------

  const lastActivity =
    new Date(
      session.lastActivityAt
    ).getTime();

  const now = Date.now();

  const secondsSinceActivity =
    Math.floor(
      (now - lastActivity) / 1000
    );

  // ---------------------------------------------------
  // Немає активності
  // ---------------------------------------------------

  if (
    secondsSinceActivity >
    INACTIVITY_TIMEOUT
  ) {
    return {
      label: "Немає активності",
      className:
        "bg-orange-100 text-orange-800",
    };
  }

  // ---------------------------------------------------
  // Активне
  // ---------------------------------------------------

  return {
    label: "Активне",
    className:
      "bg-green-100 text-green-800",
  };
}

// =====================================================
// СТОРІНКА МОНІТОРИНГУ
// =====================================================

export default async function MonitoringPage() {
  const sessions =
    await prisma.testSession.findMany({
      where: {
        finished: false,

        OR: [
          // ------------------------------------------------
          // Активні / нещодавно активні сесії
          // ------------------------------------------------

          {
            lastActivityAt: {
              gte: new Date(
                Date.now() -
                  INACTIVITY_TIMEOUT *
                    1000
              ),
            },
          },

          // ------------------------------------------------
          // Заблоковані сесії також залишаємо
          // в моніторингу, навіть якщо heartbeat
          // більше не надходить.
          // ------------------------------------------------

          {
            blocked: true,
          },
        ],
      },

      orderBy: {
        updatedAt: "desc",
      },

      include: {
        participant: true,

        test: {
          select: {
            id: true,
            title: true,
            subject: true,
            duration: true,
          },
        },
      },
    });

  // =====================================================
  // КІЛЬКІСТЬ АКТИВНИХ
  // =====================================================

  const activeCount =
    sessions.filter(
      (session) =>
        !session.blocked
    ).length;

  // =====================================================
  // КІЛЬКІСТЬ ЗАБЛОКОВАНИХ
  // =====================================================

  const blockedCount =
    sessions.filter(
      (session) =>
        session.blocked
    ).length;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {/* =================================================
          АВТООНОВЛЕННЯ
      ================================================= */}

      <MonitoringRefresh />

      <div className="mx-auto max-w-7xl">
        {/* =================================================
            ЗАГОЛОВОК
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#7A1F2B]">
              Моніторинг тестування
            </h1>

            <p className="mt-2 text-gray-600">
              Перегляд активних проходжень
              тестування.
            </p>
          </div>

          <Link
            href="/admin"
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
            ← До адміністратора
          </Link>
        </div>

        {/* =================================================
            ЛІЧИЛЬНИКИ
        ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {/* Загальна кількість */}

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="text-sm text-gray-500">
              Активних проходжень
            </div>

            <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
              {sessions.length}
            </div>
          </div>

          {/* Активні */}

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="text-sm text-gray-500">
              Активні
            </div>

            <div className="mt-2 text-3xl font-bold text-green-600">
              {activeCount}
            </div>
          </div>

          {/* Заблоковані */}

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="text-sm text-gray-500">
              Заблоковані
            </div>

            <div className="mt-2 text-3xl font-bold text-red-600">
              {blockedCount}
            </div>
          </div>
        </div>

        {/* =================================================
            ТАБЛИЦЯ
        ================================================= */}

        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {sessions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-xl font-semibold text-gray-700">
                Наразі немає активних
                проходжень.
              </div>

              <p className="mt-2 text-gray-500">
                Коли учасник розпочне
                тестування, він з'явиться
                тут.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* =================================================
                    ЗАГОЛОВОК ТАБЛИЦІ
                ================================================= */}

                <thead className="bg-[#7A1F2B] text-white">
                  <tr>
                    <th className="whitespace-nowrap p-4 text-left">
                      №
                    </th>

                    <th className="whitespace-nowrap p-4 text-left">
                      Учасник
                    </th>

                    <th className="whitespace-nowrap p-4 text-left">
                      Тест
                    </th>

                    <th className="whitespace-nowrap p-4 text-left">
                      Питання
                    </th>

                    <th className="whitespace-nowrap p-4 text-left">
                      Залишилось
                    </th>

                    <th className="whitespace-nowrap p-4 text-left">
                      Статус
                    </th>

                    <th className="whitespace-nowrap p-4 text-left">
                      Остання активність
                    </th>

                    <th className="whitespace-nowrap p-4 text-center">
                      Дія
                    </th>
                  </tr>
                </thead>

                {/* =================================================
                    ТІЛО ТАБЛИЦІ
                ================================================= */}

                <tbody>
                  {sessions.map(
                    (session, index) => {
                      const status =
                        getStatus(
                          session
                        );

                      const currentTimeLeft =
                        session.finished
                          ? 0
                          : getCurrentTimeLeft(
                              session
                            );

                      return (
                        <tr
                          key={session.id}
                          className="
                            border-b
                            transition
                            hover:bg-gray-50
                          "
                        >
                          {/* № */}

                          <td className="p-4">
                            {index + 1}
                          </td>

                          {/* Учасник */}

                          <td className="p-4">
                            <div className="font-semibold">
                              {getParticipantName(
                                session.participant
                              )}
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                              Session ID:{" "}
                              {session.id}
                            </div>
                          </td>

                          {/* Тест */}

                          <td className="p-4">
                            <div className="font-semibold">
                              {
                                session
                                  .test
                                  .title
                              }
                            </div>

                            <div className="mt-1 text-sm text-gray-500">
                              {
                                session
                                  .test
                                  .subject
                              }
                            </div>
                          </td>

                          {/* Поточне питання */}

                          <td className="p-4">
                            <span className="font-semibold">
                              {session.currentQuestion +
                                1}
                            </span>
                          </td>

                          {/* Залишок часу */}

                          <td className="p-4">
                            <span className="font-mono font-semibold">
                              {formatTime(
                                currentTimeLeft
                              )}
                            </span>
                          </td>

                          {/* Статус */}

                          <td className="p-4">
                            <span
                              className={`
                                inline-flex
                                rounded-full
                                px-3
                                py-1
                                text-sm
                                font-semibold
                                ${status.className}
                              `}
                            >
                              {
                                status.label
                              }
                            </span>

                            {session.blocked &&
                              session.blockReason && (
                                <div className="mt-2 max-w-xs text-xs text-red-600">
                                  {
                                    session.blockReason
                                  }
                                </div>
                              )}
                          </td>

                          {/* Остання активність */}

                          <td className="p-4 text-sm">
                            {formatDate(
                              session.lastActivityAt
                            )}
                          </td>

                          {/* Дія */}

                          <td className="p-4 text-center">
                            <Link
                              href={`/admin/monitoring/${session.id}`}
                              className="
                                inline-flex
                                rounded-lg
                                bg-[#7A1F2B]
                                px-4
                                py-2
                                font-semibold
                                text-white
                                transition
                                hover:bg-[#651923]
                              "
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
        </div>
      </div>
    </main>
  );
}