import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth/session";

export const dynamic = "force-dynamic";

function getParticipantName(result: {
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
}) {
  return [result.lastName, result.firstName, result.middleName]
    .filter(Boolean)
    .join(" ");
}

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} с`;
  }

  return `${minutes} хв ${remainingSeconds
    .toString()
    .padStart(2, "0")} с`;
}

function getFinishReason(reason: string) {
  switch (reason) {
    case "manual":
      return "Завершено учасником";

    case "timeout":
      return "Час вичерпано";

    case "blocked":
      return "Тестування перервано";

    default:
      return reason;
  }
}

export default async function ParticipantResultsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const results = await prisma.testResult.findMany({
    where: {
      session: {
        participant: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      earnedPoints: true,
      maxPoints: true,
      percent: true,
      correct: true,
      incorrect: true,
      skipped: true,
      timeSpent: true,
      finishReason: true,
      createdAt: true,
      finishedAt: true,
      startedAt: true,

      test: {
        select: {
          title: true,
          subject: true,
          examType: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#7A1F2B]">
          Результати тестування
        </h1>

        <p className="mt-2 text-gray-600">
          Історія виконаних тестів та детальна інформація про результати.
        </p>
      </div>

      {/* Статистика */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">
            Усього результатів
          </div>

          <div className="mt-1 text-3xl font-bold text-[#7A1F2B]">
            {results.length}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">
            Завершених тестів
          </div>

          <div className="mt-1 text-3xl font-bold text-green-600">
            {
              results.filter(
                (result) => result.finishReason === "manual"
              ).length
            }
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">
            Середній результат
          </div>

          <div className="mt-1 text-3xl font-bold text-[#7A1F2B]">
            {results.length > 0
              ? Math.round(
                  results.reduce(
                    (sum, result) => sum + result.percent,
                    0
                  ) / results.length
                )
              : 0}
            %
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">
            Правильних відповідей
          </div>

          <div className="mt-1 text-3xl font-bold text-green-600">
            {results.reduce(
              (sum, result) => sum + result.correct,
              0
            )}
          </div>
        </div>
      </div>

      {/* Таблиця */}
      {results.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">📊</div>

          <h2 className="mt-4 text-xl font-semibold text-gray-800">
            Результатів поки немає
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-gray-500">
            Ви ще не завершили жодного тестування. Після завершення
            тесту його результат автоматично з&apos;явиться тут.
          </p>

          <Link
            href="/cabinet/tests"
            className="mt-6 inline-flex rounded-lg bg-[#7A1F2B] px-5 py-3 font-semibold text-white transition hover:bg-[#641923]"
          >
            Перейти до тестів
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-4 py-4 font-semibold text-gray-600">
                    №
                  </th>

                  <th className="px-4 py-4 font-semibold text-gray-600">
                    Тест
                  </th>

                  <th className="px-4 py-4 font-semibold text-gray-600">
                    Предмет
                  </th>

                  <th className="px-4 py-4 font-semibold text-gray-600">
                    Дата
                  </th>

                  <th className="px-4 py-4 font-semibold text-gray-600">
                    Час
                  </th>

                  <th className="px-4 py-4 text-center font-semibold text-gray-600">
                    Бали
                  </th>

                  <th className="px-4 py-4 text-center font-semibold text-gray-600">
                    %
                  </th>

                  <th className="px-4 py-4 text-center font-semibold text-gray-600">
                    Правильні
                  </th>

                  <th className="px-4 py-4 font-semibold text-gray-600">
                    Причина завершення
                  </th>

                  <th className="px-4 py-4 text-center font-semibold text-gray-600">
                    Дії
                  </th>
                </tr>
              </thead>

              <tbody>
                {results.map((result, index) => (
                  <tr
                    key={result.id}
                    className="border-b border-gray-100 transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">
                        {result.test.title}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {result.test.examType}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {result.test.subject}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {formatDate(result.createdAt)}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {formatDuration(result.timeSpent)}
                    </td>

                    <td className="px-4 py-4 text-center font-semibold text-[#7A1F2B]">
                      {result.earnedPoints} / {result.maxPoints}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={
                          result.percent >= 80
                            ? "font-bold text-green-600"
                            : result.percent >= 50
                            ? "font-bold text-orange-500"
                            : "font-bold text-red-600"
                        }
                      >
                        {result.percent}%
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-semibold text-green-600">
                        {result.correct}
                      </span>

                      <span className="mx-1 text-gray-400">
                        /
                      </span>

                      <span className="text-red-500">
                        {result.incorrect}
                      </span>

                      {result.skipped > 0 && (
                        <>
                          <span className="mx-1 text-gray-400">
                            /
                          </span>

                          <span className="text-gray-500">
                            {result.skipped}
                          </span>
                        </>
                      )}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {getFinishReason(result.finishReason)}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/cabinet/results/${result.id}`}
                        className="inline-flex rounded-lg bg-[#7A1F2B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#641923]"
                      >
                        Переглянути
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}