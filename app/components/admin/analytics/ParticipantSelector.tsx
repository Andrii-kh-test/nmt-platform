"use client";

import { useMemo, useState } from "react";

type ParticipantResult = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  accessCode: string | null;
  earnedPoints: number;
  maxPoints: number;
  percent: number;
  createdAt: string | Date;
};

type ParticipantSelectorProps = {
  results: ParticipantResult[];

  selectedIds: number[];

  onSelectedIdsChange: (
    ids: number[]
  ) => void;
};

function getParticipantName(
  result: ParticipantResult
) {
  const parts = [
    result.lastName,
    result.firstName,
    result.middleName,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(" ")
    : "Не вказано";
}

function formatDate(
  date: string | Date
) {
  return new Date(date).toLocaleString(
    "uk-UA",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  );
}

export default function ParticipantSelector({
  results,
  selectedIds,
  onSelectedIdsChange,
}: ParticipantSelectorProps) {
  const [mode, setMode] = useState<
    "all" | "selected"
  >("all");

  const allIds = useMemo(
    () => results.map((result) => result.id),
    [results]
  );

  const isAllSelected =
    selectedIds.length === results.length;

  function selectAll() {
    onSelectedIdsChange(allIds);
  }

  function clearSelection() {
    onSelectedIdsChange([]);
  }

  function toggleParticipant(
    id: number
  ) {
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(
        selectedIds.filter(
          (selectedId) =>
            selectedId !== id
        )
      );

      return;
    }

    onSelectedIdsChange([
      ...selectedIds,
      id,
    ]);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Заголовок */}
      <div className="border-b border-gray-200 p-5">
        <h2 className="text-xl font-bold text-gray-800">
          Учасники
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Оберіть, результати яких учасників
          використовувати в аналітиці.
        </p>
      </div>

      {/* Режим */}
      <div className="flex flex-wrap gap-3 border-b border-gray-200 p-5">
        <button
          type="button"
          onClick={() => {
            setMode("all");
            selectAll();
          }}
          className={`rounded-lg px-5 py-2.5 font-semibold transition ${
            mode === "all"
              ? "bg-[#7A1F2B] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Усі учасники
        </button>

        <button
          type="button"
          onClick={() =>
            setMode("selected")
          }
          className={`rounded-lg px-5 py-2.5 font-semibold transition ${
            mode === "selected"
              ? "bg-[#7A1F2B] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Вибрати учасників
        </button>
      </div>

      {/* Режим усіх */}
      {mode === "all" && (
        <div className="p-5">
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
            У статистиці враховуються
            результати всіх учасників:
            <strong className="ml-1">
              {results.length}
            </strong>
          </div>
        </div>
      )}

      {/* Вибір конкретних */}
      {mode === "selected" && (
        <div>
          {/* Панель керування */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-600">
              Вибрано:
              <strong className="ml-1 text-[#7A1F2B]">
                {selectedIds.length}
              </strong>
              {" "}із{" "}
              <strong>
                {results.length}
              </strong>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                disabled={isAllSelected}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Обрати всіх
              </button>

              <button
                type="button"
                onClick={clearSelection}
                disabled={
                  selectedIds.length === 0
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Очистити
              </button>
            </div>
          </div>

          {/* Таблиця */}
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="w-14 p-3 text-center">
                    #
                  </th>

                  <th className="p-3 text-left">
                    Учасник
                  </th>

                  <th className="p-3 text-left">
                    Код
                  </th>

                  <th className="p-3 text-center">
                    Бал
                  </th>

                  <th className="p-3 text-center">
                    %
                  </th>

                  <th className="p-3 text-left">
                    Дата
                  </th>
                </tr>
              </thead>

              <tbody>
                {results.map(
                  (result, index) => {
                    const checked =
                      selectedIds.includes(
                        result.id
                      );

                    return (
                      <tr
                        key={result.id}
                        onClick={() =>
                          toggleParticipant(
                            result.id
                          )
                        }
                        className={`cursor-pointer border-t border-gray-100 transition ${
                          checked
                            ? "bg-red-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleParticipant(
                                result.id
                              )
                            }
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="h-4 w-4 accent-[#7A1F2B]"
                          />
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-gray-900">
                            {getParticipantName(
                              result
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          {result.accessCode ? (
                            <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                              {result.accessCode}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="p-3 text-center font-semibold">
                          {result.earnedPoints}
                          {" / "}
                          {result.maxPoints}
                        </td>

                        <td className="p-3 text-center font-bold text-[#7A1F2B]">
                          {result.percent}%
                        </td>

                        <td className="p-3 text-sm text-gray-600">
                          {formatDate(
                            result.createdAt
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>

            {results.length === 0 && (
              <div className="p-10 text-center text-gray-500">
                Результатів цього тесту
                поки немає.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}