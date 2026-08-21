import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const participants = await prisma.participant.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sessions: {
        include: {
          test: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  return (
    <div>
      {/* Заголовок */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-[#7A1F2B]">
            Користувачі
          </h2>

          <p className="mt-2 text-lg text-gray-600">
            Зареєстровані учасники платформи тестування.
          </p>
        </div>

        <Link
          href="/admin"
          className="
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2
            font-medium
            text-gray-700
            transition
            hover:bg-gray-50
          "
        >
          ← До панелі
        </Link>
      </div>

      {/* Статистика */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">
            Усього учасників
          </div>

          <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
            {participants.length}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">
            Із завершеними сесіями
          </div>

          <div className="mt-2 text-3xl font-bold text-green-700">
            {
              participants.filter((participant) =>
                participant.sessions.some(
                  (session) => session.finished
                )
              ).length
            }
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">
            Активні сесії
          </div>

          <div className="mt-2 text-3xl font-bold text-orange-600">
            {
              participants.filter((participant) =>
                participant.sessions.some(
                  (session) =>
                    !session.finished &&
                    !session.blocked
                )
              ).length
            }
          </div>
        </div>
      </div>

      {/* Таблиця */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {participants.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl">👥</div>

            <h3 className="mt-4 text-xl font-semibold text-gray-800">
              Учасників поки немає
            </h3>

            <p className="mt-2 text-gray-500">
              Після проходження тестів тут з’являться учасники.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    #
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Учасник
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Сесії
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Завершені
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Остання активність
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Дія
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {participants.map((participant, index) => {
                  const finishedSessions =
                    participant.sessions.filter(
                      (session) => session.finished
                    );

                  const latestSession =
                    participant.sessions[0];

                  const fullName = [
                    participant.lastName,
                    participant.firstName,
                    participant.middleName,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr
                      key={participant.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {fullName}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          ID: {participant.id}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {participant.sessions.length}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <span
                          className="
                            inline-flex
                            rounded-full
                            bg-green-100
                            px-3
                            py-1
                            font-medium
                            text-green-700
                          "
                        >
                          {finishedSessions.length}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {latestSession
                          ? new Date(
                              latestSession.updatedAt
                            ).toLocaleString("uk-UA")
                          : "—"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/users/${participant.id}`}
                          className="
                            inline-flex
                            rounded-lg
                            bg-[#7A1F2B]
                            px-4
                            py-2
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-[#641923]
                          "
                        >
                          Переглянути
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}