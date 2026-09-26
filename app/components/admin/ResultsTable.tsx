"use client";

import Link from "next/link";
import { useState } from "react";

import DeleteResultButton from "@/app/components/admin/DeleteResultButton";

type Result = {
  id: number;
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
  accessCode: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  timeSpent: number;
  earnedPoints: number;
  maxPoints: number;
  percent: number;
  correct: number;
  incorrect: number;
  skipped: number;
  finishReason: string;
  test: {
    title: string;
    subject: string;
  };
};

type ResultsTableProps = {
  results: Result[];
};

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
// ФОРМАТУВАННЯ ДАТИ Й ЧАСУ
// =====================================================

function formatDate(date: Date | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString(
    "uk-UA",
    {
      dateStyle: "short",
      timeStyle: "medium",
    }
  );
}

// =====================================================
// ФОРМАТУВАННЯ ТРИВАЛОСТІ
// =====================================================

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return "00:00";
  }

  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const remainingSeconds =
    seconds % 60;

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
        label:
          reason || "Не вказано",
        className:
          "bg-gray-100 text-gray-800 border-gray-200",
      };
  }
}

// =====================================================
// ТАБЛИЦЯ РЕЗУЛЬТАТІВ
// =====================================================

export default function ResultsTable({
  results,
}: ResultsTableProps) {
  const [selectedIds, setSelectedIds] =
    useState<number[]>([]);

  const [deleting, setDeleting] =
    useState(false);

  // ===================================================
  // ВИБРАНІСТЬ
  // ===================================================

  const allSelected =
    results.length > 0 &&
    selectedIds.length === results.length;

  const someSelected =
    selectedIds.length > 0 &&
    selectedIds.length < results.length;

  // ===================================================
  // ВИБІР ОДНОГО РЕЗУЛЬТАТУ
  // ===================================================

  function toggleResult(
    resultId: number
  ) {
    setSelectedIds((current) => {
      if (current.includes(resultId)) {
        return current.filter(
          (id) => id !== resultId
        );
      }

      return [
        ...current,
        resultId,
      ];
    });
  }

  // ===================================================
  // ВИБІР УСІХ
  // ===================================================

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(
      results.map(
        (result) => result.id
      )
    );
  }

  // ===================================================
  // МАСОВЕ ВИДАЛЕННЯ
  // ===================================================

  async function handleBulkDelete() {
    if (
      selectedIds.length === 0 ||
      deleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Видалити вибрані результати (${selectedIds.length})?\n\nЦю дію неможливо скасувати.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response =
        await fetch(
          "/api/results",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ids: selectedIds,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Не вдалося видалити вибрані результати."
        );
      }

      // Після успішного видалення
      // оновлюємо серверну сторінку.
      window.location.reload();
    } catch (error) {
      console.error(
        "BULK DELETE RESULTS ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Не вдалося видалити вибрані результати."
      );

      setDeleting(false);
    }
  }

  return (
    <>
      {/* =====================================================
          ПАНЕЛЬ МАСОВИХ ДІЙ
      ===================================================== */}

      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="text-sm font-medium text-gray-700">
            Вибрано результатів:{" "}
            <span className="font-bold text-[#7A1F2B]">
              {selectedIds.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={deleting}
            className="
              inline-flex
              items-center
              justify-center
              rounded-lg
              bg-red-600
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition-all
              hover:bg-red-700
              hover:shadow-md
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {deleting
              ? "Видалення..."
              : `Видалити вибрані (${selectedIds.length})`}
          </button>

        </div>
      )}

      {/* =====================================================
          ЖУРНАЛ
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">

        <div className="overflow-x-auto">

          <table className="min-w-[1920px] w-full border-collapse">

            {/* =================================================
                ЗАГОЛОВОК
            ================================================= */}

            <thead className="bg-[#7A1F2B] text-white">

              <tr>

                {/* ВИБІР */}
                <th className="sticky left-0 z-20 w-[60px] border-r border-white/10 bg-[#7A1F2B] px-3 py-4 text-center">

                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate =
                          someSelected;
                      }
                    }}
                    onChange={toggleAll}
                    aria-label="Обрати всі результати"
                    className="h-5 w-5 cursor-pointer accent-[#7A1F2B]"
                  />

                </th>

                {/* № */}
                <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-semibold">
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
                ТІЛО
            ================================================= */}

            <tbody>

              {results.length === 0 ? (

                <tr>

                  <td
                    colSpan={15}
                    className="p-16 text-center"
                  >

                    <div className="text-5xl">
                      📊
                    </div>

                    <div className="mt-4 text-lg font-semibold text-gray-700">
                      Результатів тестування
                      поки немає
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      Після проходження тестів
                      результати з'являться тут.
                    </div>

                  </td>

                </tr>

              ) : (

                results.map(
                  (result, index) => {
                    const finishReason =
                      getFinishReason(
                        result.finishReason
                      );

                    const isSelected =
                      selectedIds.includes(
                        result.id
                      );

                    return (

                      <tr
                        key={result.id}
                        className={`
                          border-b
                          border-gray-100
                          transition-colors
                          hover:bg-[#FDF8F9]
                          ${
                            isSelected
                              ? "bg-[#FFF5F6]"
                              : ""
                          }
                        `}
                      >

                        {/* =================================================
                            ЧЕКБОКС
                        ================================================= */}

                        <td
                          className={`
                            sticky
                            left-0
                            z-10
                            border-r
                            border-gray-100
                            px-3
                            py-4
                            text-center
                            ${
                              isSelected
                                ? "bg-[#FFF5F6]"
                                : "bg-white"
                            }
                          `}
                        >

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleResult(
                                result.id
                              )
                            }
                            aria-label={`Обрати результат №${index + 1}`}
                            className="h-5 w-5 cursor-pointer accent-[#7A1F2B]"
                          />

                        </td>

                        {/* =================================================
                            №
                        ================================================= */}

                        <td
                          className={`
                            border-r
                            border-gray-100
                            px-4
                            py-4
                            text-center
                            font-semibold
                            text-gray-700
                            ${
                              isSelected
                                ? "bg-[#FFF5F6]"
                                : "bg-white"
                            }
                          `}
                        >
                          {index + 1}
                        </td>

                        {/* =================================================
                            ПІБ
                        ================================================= */}

                        <td className="min-w-[250px] px-5 py-4">

                          <div className="font-semibold text-gray-900">
                            {getParticipantName(
                              result
                            )}
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
                          {formatDate(
                            result.startedAt
                          )}
                        </td>

                        {/* =================================================
                            ЗАВЕРШЕННЯ
                        ================================================= */}

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                          {formatDate(
                            result.finishedAt
                          )}
                        </td>

                        {/* =================================================
                            ЧАС
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
                            /{" "}
                            {
                              result.maxPoints
                            }
                          </span>

                        </td>

                        {/* =================================================
                            %
                        ================================================= */}

                        <td className="px-5 py-4 text-center">

                          <span
                            className={`font-bold ${
                              result.percent >=
                              80
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
                            ПРИЧИНА
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
                            {
                              finishReason.label
                            }
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
                              resultId={
                                result.id
                              }
                              participantName={getParticipantName(
                                result
                              )}
                            />

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>
    </>
  );
}