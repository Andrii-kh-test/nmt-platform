"use client";

import { useState } from "react";

type Props = {
  resultId: number;
  initialAllowed: boolean;
};

export default function ParticipantDetailsToggle({
  resultId,
  initialAllowed,
}: Props) {
  const [allowed, setAllowed] =
    useState(initialAllowed);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleChange() {
    const nextValue = !allowed;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/results/${resultId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            allowParticipantDetails:
              nextValue,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося змінити дозвіл."
        );
      }

      setAllowed(
        data.allowParticipantDetails
      );
    } catch (error) {
      console.error(
        "PARTICIPANT DETAILS TOGGLE ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Не вдалося змінити дозвіл."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Перегляд завдань учасником
          </h2>

          {allowed ? (
            <p className="mt-1 text-sm text-green-700">
              Учасник може переглядати умови
              завдань, варіанти відповідей,
              свої відповіді та правильні відповіді.
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-600">
              Учасник не може переглядати завдання
              та умови цього тестування.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleChange}
          disabled={loading}
          className={`inline-flex min-w-[250px] items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
            allowed
              ? "bg-gray-600 hover:bg-gray-700"
              : "bg-[#7A1F2B] hover:bg-[#651923]"
          }`}
        >
          {loading
            ? "Збереження..."
            : allowed
              ? "Заборонити перегляд"
              : "Дозволити перегляд завдань"}
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm">
        {allowed ? (
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-lg">
              👁️
            </span>

            <span>
              Перегляд завдань для учасника
              дозволено.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-lg">
              🔒
            </span>

            <span>
              Завдання приховані від учасника.
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </section>
  );
}