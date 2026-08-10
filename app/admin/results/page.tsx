import Link from "next/link";

import { prisma } from "@/app/lib/prisma";
export const dynamic = "force-dynamic";
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

  return parts.length > 0 ? parts.join(" ") : "Не вказано";
}

function getFinishReason(reason: string) {
  switch (reason) {
    case "manual":
      return {
        label: "Вручну",
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

export default async function AdminResultsPage() {
  const results =
    await prisma.testResult.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        test: true,
      },
    });

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-[1800px]">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#7A1F2B]">
            Журнал результатів тестування
          </h1>

          <p className="mt-2 text-gray-600">
            Перелік результатів учасників
            із детальною інформацією про
            проходження тестування.
          </p>
        </div>

        {/* Лічильник */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">
            Усього результатів
          </div>

          <div className="mt-1 text-3xl font-bold text-[#7A1F2B]">
            {results.length}
          </div>
        </div>

        {/* Журнал */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full">
              <thead className="bg-[#7A1F2B] text-white">
                <tr>
                  <th className="whitespace-nowrap p-4 text-left">
                    №
                  </th>

                  <th className="whitespace-nowrap p-4 text-left">
                    ПІБ
                  </th>

                  <th className="whitespace-nowrap p-4 text-left">
                    Код
                  </th>

                  <th className="whitespace-nowrap p-4 text-left">
                    Тест
                  </th>

                  <th className="whitespace-nowrap p-4 text-left">
                    Початок
                  </th>

                  <th className="whitespace-nowrap p-4 text-left">
                    Завершення
                  </th>

                  <th className="whitespace-nowrap p-4 text-left">
                    Час
                  </th>

                  <th className="whitespace-nowrap p-4 text-left">
                    Бали
                  </th>

                  <th className="whitespace-nowrap p-4 text-left">
                    %
                  </th>

                  <th className="whitespace-nowrap p-4 text-center">
                    Правильні
                  </th>

                  <th className="whitespace-nowrap p-4 text-center">
                    Неправильні
                  </th>

                  <th className="whitespace-nowrap p-4 text-center">
                    Пропущені
                  </th>

                  <th className="whitespace-nowrap p-4 text-left">
                    Причина завершення
                  </th>

                  <th className="whitespace-nowrap p-4 text-center">
                    Деталі
                  </th>
                </tr>
              </thead>

              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td
                      colSpan={14}
                      className="p-12 text-center text-gray-500"
                    >
                      Результатів тестування
                      поки немає.
                    </td>
                  </tr>
                ) : (
                  results.map((result, index) => {
                    const finishReason =
                      getFinishReason(
                        result.finishReason
                      );

                    return (
                      <tr
                        key={result.id}
                        className="border-b border-gray-100 transition hover:bg-gray-50"
                      >
                        {/* № */}
                        <td className="p-4 font-semibold">
                          {index + 1}
                        </td>

                        {/* ПІБ */}
                        <td className="min-w-[230px] p-4">
                          <div className="font-semibold text-gray-900">
                            {getParticipantName(
                              result
                            )}
                          </div>
                        </td>

                        {/* Код */}
                        <td className="p-4">
                          {result.accessCode ? (
                            <span className="rounded-md bg-gray-100 px-3 py-1 font-mono text-sm">
                              {result.accessCode}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Тест */}
                        <td className="min-w-[220px] p-4">
                          <div className="font-medium">
                            {result.test.title}
                          </div>

                          <div className="text-sm text-gray-500">
                            {result.test.subject}
                          </div>
                        </td>

                        {/* Початок */}
                        <td className="whitespace-nowrap p-4 text-sm">
                          {formatDate(
                            result.startedAt
                          )}
                        </td>

                        {/* Завершення */}
                        <td className="whitespace-nowrap p-4 text-sm">
                          {formatDate(
                            result.finishedAt
                          )}
                        </td>

                        {/* Час */}
                        <td className="whitespace-nowrap p-4 font-mono text-sm">
                          {formatDuration(
                            result.timeSpent
                          )}
                        </td>

                        {/* Бали */}
                        <td className="whitespace-nowrap p-4 font-bold text-[#7A1F2B]">
                          {result.earnedPoints}{" "}
                          / {result.maxPoints}
                        </td>

                        {/* Відсоток */}
                        <td className="p-4">
                          <span
                            className={`font-bold ${
                              result.percent >= 80
                                ? "text-green-600"
                                : result.percent >=
                                  50
                                ? "text-orange-600"
                                : "text-red-600"
                            }`}
                          >
                            {result.percent}%
                          </span>
                        </td>

                        {/* Правильні */}
                        <td className="p-4 text-center font-semibold text-green-600">
                          {result.correct}
                        </td>

                        {/* Неправильні */}
                        <td className="p-4 text-center font-semibold text-red-600">
                          {result.incorrect}
                        </td>

                        {/* Пропущені */}
                        <td className="p-4 text-center font-semibold text-gray-500">
                          {result.skipped}
                        </td>

                        {/* Причина */}
                        <td className="p-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${finishReason.className}`}
                          >
                            {finishReason.label}
                          </span>
                        </td>

                        {/* Деталі */}
                        <td className="p-4 text-center">
                          <Link
                            href={`/result/${result.id}`}
                            className="
                              inline-block
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}