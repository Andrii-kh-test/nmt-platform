import Link from "next/link";

import { prisma } from "@/app/lib/prisma";

import MonitoringRefresh from "./MonitoringRefresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const INACTIVITY_TIMEOUT = 90;

// =====================================================
// ПІБ
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
// СТАТУС
// =====================================================

function getStatus(session: {
  blocked: boolean;
  finished: boolean;
  lastActivityAt: Date;
}) {
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
  // Активність
  // ---------------------------------------------------

  const lastActivity =
    new Date(
      session.lastActivityAt
    ).getTime();

  const secondsSinceActivity =
    Math.floor(
      (Date.now() - lastActivity) / 1000
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
        // ------------------------------------------------
        // Завершені сесії НЕ показуємо на головній
        // сторінці моніторингу.
        //
        // Вони залишаються в БД і доступні через
        // окремі сторінки/результати.
        // ------------------------------------------------

        finished: false,

        OR: [
          // ------------------------------------------------
          // Активні / нещодавно активні
          // ------------------------------------------------

          {
            lastActivityAt: {
              gte: new Date(
                Date.now() -
                  INACTIVITY_TIMEOUT * 1000
              ),
            },
          },

          // ------------------------------------------------
          // Заблоковані показуємо завжди
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
          },
        },
      },
    });

  // =====================================================
  // КІЛЬКІСТЬ
  // =====================================================

  const activeCount =
    sessions.filter(
      (session) =>
        !session.blocked
    ).length;

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
              Перегляд поточних проходжень
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
              Проходжень
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
            КАРТКИ УЧАСНИКІВ
        ================================================= */}

        {sessions.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-lg">
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
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map(
              (session) => {
                const status =
                  getStatus(session);

                const participantName =
                  getParticipantName(
                    session.participant
                  );

                return (
                  <Link
                    key={session.id}
                    href={`/admin/monitoring/${session.id}`}
                    className="
                      group
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      p-6
                      shadow-lg
                      transition
                      hover:-translate-y-1
                      hover:border-[#7A1F2B]
                      hover:shadow-xl
                    "
                  >
                    {/* Верхня частина */}

                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-500">
                          Учасник
                        </div>

                        <div className="mt-1 text-xl font-bold text-gray-900">
                          {participantName}
                        </div>
                      </div>

                      <span
                        className={`
                          shrink-0
                          rounded-full
                          px-3
                          py-1
                          text-sm
                          font-semibold
                          ${status.className}
                        `}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Тест */}

                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <div className="text-sm text-gray-500">
                        Тест
                      </div>

                      <div className="mt-1 font-semibold text-gray-800">
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
                    </div>

                    {/* Session ID */}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        Session ID:{" "}
                        {session.id}
                      </div>

                      <div
                        className="
                          text-sm
                          font-semibold
                          text-[#7A1F2B]
                          transition
                          group-hover:translate-x-1
                        "
                      >
                        Переглянути →
                      </div>
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}