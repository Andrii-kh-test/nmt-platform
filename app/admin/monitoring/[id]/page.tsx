import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";
import MonitoringControls from "./MonitoringControls";
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

export default async function MonitoringDetailsPage({
  params,
}: Props) {
  const { id } = await params;

  const sessionId = Number(id);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    notFound();
  }

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
          },
        },
      },
    });

  if (!session) {
    notFound();
  }

  const participantName =
    getParticipantName(
      session.participant
    );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Верхня панель */}

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

        {/* Статус */}

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
            </div>
          ) : session.finished ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="text-xl font-bold text-gray-700">
                Тестування завершено
              </div>
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

        {/* Учасник */}

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

        {/* Тест */}

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

        {/* Поточний стан */}

        <section className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-2xl font-bold text-[#7A1F2B]">
            Поточний стан
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-5 text-center">
              <div className="text-sm text-gray-500">
                Поточне питання
              </div>

              <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
                {session.currentQuestion + 1}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-5 text-center">
              <div className="text-sm text-gray-500">
                Залишилось часу
              </div>

              <div className="mt-2 font-mono text-3xl font-bold text-[#7A1F2B]">
                {formatTime(
                  session.timeLeft
                )}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-5 text-center">
              <div className="text-sm text-gray-500">
                Додатковий час
              </div>

              <div className="mt-2 text-3xl font-bold text-[#7A1F2B]">
                {formatTime(
                  session.extraTime
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Час */}

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
                Останнє оновлення
              </div>

              <div className="mt-1 font-semibold">
                {formatDate(
                  session.updatedAt
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

        {/* Панель керування */}

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

        {/* Нижня кнопка */}

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