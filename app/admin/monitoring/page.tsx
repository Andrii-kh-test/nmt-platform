import Link from "next/link";

import { prisma } from "@/app/lib/prisma";
import MonitoringRefresh from "./MonitoringRefresh";
function formatDate(date: Date | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("uk-UA", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function formatTime(seconds: number) {
  if (seconds <= 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(remainingSeconds).padStart(
    2,
    "0"
  )}`;
}

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

function getStatus(session: {
  blocked: boolean;
  blockReason: string | null;
  lastActivityAt: Date;
}) {
  if (session.blocked) {
    return {
      label: "Заблоковано",
      className:
        "bg-red-100 text-red-800",
    };
  }

  const lastActivity =
    new Date(
      session.lastActivityAt
    ).getTime();

  const now = Date.now();

  const secondsSinceActivity =
    Math.floor(
      (now - lastActivity) / 1000
    );

  if (secondsSinceActivity > 60) {
    return {
      label: "Немає активності",
      className:
        "bg-orange-100 text-orange-800",
    };
  }

  return {
    label: "Активне",
    className:
      "bg-green-100 text-green-800",
  };
}

export default async function MonitoringPage() {
  const sessions =
    await prisma.testSession.findMany({
      where: {
        finished: false,
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

  return (
    <main className="min-h-screen bg-gray-100 p-6">
        <MonitoringRefresh />
      <div className="mx-auto max-w-7xl">
        {/* Заголовок */}

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

        {/* Лічильник */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="text-sm text-gray-500">
              Активних проходжень
            </div>

            <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
              {sessions.length}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="text-sm text-gray-500">
              Активні
            </div>

            <div className="mt-2 text-3xl font-bold text-green-600">
              {
                sessions.filter(
                  (session) =>
                    !session.blocked
                ).length
              }
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="text-sm text-gray-500">
              Заблоковані
            </div>

            <div className="mt-2 text-3xl font-bold text-red-600">
              {
                sessions.filter(
                  (session) =>
                    session.blocked
                ).length
              }
            </div>
          </div>
        </div>

        {/* Таблиця */}

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

                <tbody>
                  {sessions.map(
                    (session, index) => {
                      const status =
                        getStatus(session);

                      return (
                        <tr
                          key={session.id}
                          className="
                            border-b
                            transition
                            hover:bg-gray-50
                          "
                        >
                          <td className="p-4">
                            {index + 1}
                          </td>

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

                          <td className="p-4">
                            <div className="font-semibold">
                              {
                                session.test
                                  .title
                              }
                            </div>

                            <div className="mt-1 text-sm text-gray-500">
                              {
                                session.test
                                  .subject
                              }
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="font-semibold">
                              {session.currentQuestion +
                                1}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="font-mono font-semibold">
                              {formatTime(
                                session.timeLeft
                              )}
                            </span>
                          </td>

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

                          <td className="p-4 text-sm">
                            {formatDate(
                              session.lastActivityAt
                            )}
                          </td>

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