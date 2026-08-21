import Link from "next/link";

import { prisma } from "@/app/lib/prisma";
import DeleteResultButton from "@/app/components/admin/DeleteResultButton";

export const dynamic = "force-dynamic";

// =====================================================
// ФОРМАТУВАННЯ ДАТИ Й ЧАСУ
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
// ФОРМАТУВАННЯ ТРИВАЛОСТІ
// =====================================================

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

// =====================================================
// ПІБ УЧАСНИКА
// =====================================================

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

  return parts.length > 0
    ? parts.join(" ")
    : "Не вказано";
}

// =====================================================
// ПРИЧИНА ЗАВЕРШЕННЯ
// =====================================================

function getFinishReason(reason: string) {
  switch (reason) {
    case "manual":
      return {
        label: "Вручну",
        className:
          "bg-green-100 text-green-800 border-green-200",
      };

    case "timeout":
      return {
        label: "Час вичерпано",
        className:
          "bg-orange-100 text-orange-800 border-orange-200",
      };

    case "security":
      return {
        label: "Порушення правил",
        className:
          "bg-red-100 text-red-800 border-red-200",
      };

    default:
      return {
        label: reason || "Не вказано",
        className:
          "bg-gray-100 text-gray-800 border-gray-200",
      };
  }
}

// =====================================================
// СТОРІНКА РЕЗУЛЬТАТІВ
// =====================================================

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
      <div className="mx-auto max-w-[1900px]">

        {/* =====================================================
            ЗАГОЛОВОК
        ===================================================== */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-[#7A1F2B]">
            Журнал результатів тестування
          </h1>

          <p className="mt-2 text-gray-600">
            Перелік результатів учасників із детальною
            інформацією про проходження тестування.
          </p>
        </div>

        {/* =====================================================
            ЛІЧИЛЬНИК
        ===================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

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
              Завершено
            </div>

            <div className="mt-1 text-3xl font-bold text-green-600">
              {
                results.filter(
                  (result) =>
                    result.finishReason === "manual"
                ).length
              }
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-gray-500">
              Перервано / час вичерпано
            </div>

            <div className="mt-1 text-3xl font-bold text-orange-600">
              {
                results.filter(
                  (result) =>
                    result.finishReason !== "manual"
                ).length
              }
            </div>
          </div>

        </div>

        {/* =====================================================
            ЖУРНАЛ
        ===================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">

          <div className="overflow-x-auto">

            <table className="min-w-[1850px] w-full border-collapse">

              {/* =================================================
                  ЗАГОЛОВОК ТАБЛИЦІ
              ================================================= */}

              <thead className="bg-[#7A1F2B] text-white">

                <tr>

                  {/* № */}
                  <th className="sticky left-0 z-20 whitespace-nowrap border-r border-white/10 bg-[#7A1F2B] px-4 py-4 text-center text-sm font-semibold">
                    №
                  </th>

                  {/* ПІБ */}
                  <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-semibold">
                    ПІБ учасника
                  </th>

                  {/* Тест */}
                  <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-semibold">
                    Тест
                  </th>

                  {/* Код */}
                  <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-semibold">
                    Код
                  </th>

                  {/* Початок */}
                  <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-semibold">
                    Початок
                  </th>

                  {/* Завершення */}
                  <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-semibold">
                    Завершення
                  </th>

                  {/* Час */}
                  <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-semibold">
                    Час тестування
                  </th>

                  {/* Бали */}
                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    Бали
                  </th>

                  {/* % */}
                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    %
                  </th>

                  {/* Правильні */}
                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    Правильні
                  </th>

                  {/* Неправильні */}
                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    Неправильні
                  </th>

                  {/* Пропущені */}
                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    Пропущені
                  </th>

                  {/* Причина */}
                  <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-semibold">
                    Причина завершення
                  </th>

                  {/* Дії */}
                  <th className="whitespace-nowrap px-5 py-4 text-center text-sm font-semibold">
                    Дії
                  </th>

                </tr>

              </thead>

              {/* =================================================
                  ТІЛО ТАБЛИЦІ
              ================================================= */}

              <tbody>

                {results.length === 0 ? (

                  <tr>

                    <td
                      colSpan={14}
                      className="p-16 text-center"
                    >

                      <div className="text-5xl">
                        📊
                      </div>

                      <div className="mt-4 text-lg font-semibold text-gray-700">
                        Результатів тестування поки немає
                      </div>

                      <div className="mt-1 text-sm text-gray-500">
                        Після проходження тестів результати
                        з'являться тут.
                      </div>

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
                        className="
                          border-b
                          border-gray-100
                          transition-colors
                          hover:bg-[#FDF8F9]
                        "
                      >

                        {/* =================================================
                            №
                        ================================================= */}

                        <td
                          className="
                            sticky
                            left-0
                            z-10
                            border-r
                            border-gray-100
                            bg-white
                            px-4
                            py-4
                            text-center
                            font-semibold
                            text-gray-700
                          "
                        >
                          {index + 1}
                        </td>

                        {/* =================================================
                            ПІБ
                        ================================================= */}

                        <td className="min-w-[250px] px-5 py-4">

                          <div className="font-semibold text-gray-900">
                            {getParticipantName(result)}
                          </div>

                        </td>

                        {/* =================================================
                            ТЕСТ
                        ================================================= */}

                        <td className="min-w-[250px] px-5 py-4">

                          <div className="font-semibold text-gray-900">
                            {result.test.title}
                          </div>

                          <div className="mt-1 text-sm text-gray-500">
                            {result.test.subject}
                          </div>

                        </td>

                        {/* =================================================
                            КОД
                        ================================================= */}

                        <td className="px-5 py-4">

                          {result.accessCode ? (

                            <span
                              className="
                                inline-flex
                                rounded-lg
                                border
                                border-gray-200
                                bg-gray-50
                                px-3
                                py-1.5
                                font-mono
                                text-sm
                                font-semibold
                                text-gray-700
                              "
                            >
                              {result.accessCode}
                            </span>

                          ) : (
                            "—"
                          )}

                        </td>

                        {/* =================================================
                            ПОЧАТОК
                        ================================================= */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                          {formatDate(result.startedAt)}
                        </td>

                        {/* =================================================
                            ЗАВЕРШЕННЯ
                        ================================================= */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                          {formatDate(result.finishedAt)}
                        </td>

                        {/* =================================================
                            ЧАС ТЕСТУВАННЯ
                        ================================================= */}

                        <td className="whitespace-nowrap px-5 py-4">

                          <span
                            className="
                              inline-flex
                              rounded-lg
                              bg-gray-100
                              px-3
                              py-1.5
                              font-mono
                              text-sm
                              font-semibold
                              text-gray-700
                            "
                          >
                            {formatDuration(
                              result.timeSpent
                            )}
                          </span>

                        </td>

                        {/* =================================================
                            БАЛИ
                        ================================================= */}

                        <td className="whitespace-nowrap px-5 py-4 text-center">

                          <span className="font-bold text-[#7A1F2B]">
                            {result.earnedPoints}
                          </span>

                          <span className="text-gray-400">
                            {" "}
                            / {result.maxPoints}
                          </span>

                        </td>

                        {/* =================================================
                            %
                        ================================================= */}

                        <td className="px-5 py-4 text-center">

                          <span
                            className={`font-bold ${
                              result.percent >= 80
                                ? "text-green-600"
                                : result.percent >= 50
                                ? "text-orange-600"
                                : "text-red-600"
                            }`}
                          >
                            {result.percent}%
                          </span>

                        </td>

                        {/* =================================================
                            ПРАВИЛЬНІ
                        ================================================= */}

                        <td className="px-5 py-4 text-center">

                          <span
                            className="
                              inline-flex
                              min-w-10
                              justify-center
                              rounded-lg
                              bg-green-50
                              px-3
                              py-1.5
                              font-semibold
                              text-green-700
                            "
                          >
                            {result.correct}
                          </span>

                        </td>

                        {/* =================================================
                            НЕПРАВИЛЬНІ
                        ================================================= */}

                        <td className="px-5 py-4 text-center">

                          <span
                            className="
                              inline-flex
                              min-w-10
                              justify-center
                              rounded-lg
                              bg-red-50
                              px-3
                              py-1.5
                              font-semibold
                              text-red-700
                            "
                          >
                            {result.incorrect}
                          </span>

                        </td>

                        {/* =================================================
                            ПРОПУЩЕНІ
                        ================================================= */}

                        <td className="px-5 py-4 text-center">

                          <span
                            className="
                              inline-flex
                              min-w-10
                              justify-center
                              rounded-lg
                              bg-gray-100
                              px-3
                              py-1.5
                              font-semibold
                              text-gray-600
                            "
                          >
                            {result.skipped}
                          </span>

                        </td>

                        {/* =================================================
                            ПРИЧИНА ЗАВЕРШЕННЯ
                        ================================================= */}

                        <td className="px-5 py-4">

                          <span
                            className={`
                              inline-flex
                              whitespace-nowrap
                              rounded-full
                              border
                              px-3
                              py-1.5
                              text-sm
                              font-semibold
                              ${finishReason.className}
                            `}
                          >
                            {finishReason.label}
                          </span>

                        </td>

                        {/* =================================================
                            ДІЇ
                        ================================================= */}

                        <td className="px-5 py-4">

                          <div className="flex items-center justify-center gap-2">

                            <Link
                              href={`/admin/results/${result.id}`}
                              className="
                                inline-flex
                                items-center
                                justify-center
                                rounded-lg
                                bg-[#7A1F2B]
                                px-4
                                py-2
                                text-sm
                                font-semibold
                                text-white
                                shadow-sm
                                transition-all
                                hover:bg-[#651923]
                                hover:shadow-md
                              "
                            >
                              Переглянути
                            </Link>

                            <DeleteResultButton
                              resultId={result.id}
                              participantName={getParticipantName(
                                result
                              )}
                            />

                          </div>

                        </td>

                      </tr>

                    );
                  })

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =====================================================
            ПІДКАЗКА
        ===================================================== */}

        {results.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            <span className="font-semibold text-gray-700">
              Підказка:
            </span>{" "}
            натисніть «Переглянути», щоб відкрити детальну
            інформацію про проходження тесту учасником.
          </div>
        )}

      </div>
    </main>
  );
}