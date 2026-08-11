"use client";

import { useEffect, useState } from "react";

type Props = {
  sessionId: number;
  testId: number;
  blocked: boolean;
};

export default function MonitoringControls({
  sessionId,
  testId,
  blocked: initialBlocked,
}: Props) {
  const [blocked, setBlocked] =
    useState(initialBlocked);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function manageSession(
    action: "block" | "unblock" | "addTime",
    minutes?: number
  ) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/session/manage/${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            ...(minutes !== undefined
              ? { minutes }
              : {}),
            ...(action === "block"
              ? {
                  reason:
                    "Тестування заблоковано через порушення правил тестування",
                }
              : {}),
          }),
        }
      );

      const data = await response.json();
console.log("ADMIN MANAGE REQUEST:", {
  sessionId,
  testId,
  action,
  minutes,
});

console.log("ADMIN MANAGE RESPONSE:", {
  status: response.status,
  ok: response.ok,
  data,
});
      if (!response.ok) {
        throw new Error(
          data.error ||
            "Не вдалося виконати операцію."
        );
      }

      if (action === "block") {
        setBlocked(true);

        setMessage(
          "Тестування заблоковано."
        );
      }

      if (action === "unblock") {
        setBlocked(false);

        setMessage(
          "Тестування розблоковано."
        );
      }

      if (action === "addTime") {
        setMessage(
          `Додано ${minutes} хвилин.`
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Сталася помилка."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // Автоматично прибираємо повідомлення
  // ==========================================

  useEffect(() => {
    if (!message && !error) {
      return;
    }

    const timer =
      setTimeout(() => {
        setMessage("");
        setError("");
      }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [message, error]);

  return (
    <div className="space-y-6">
      {/* Повідомлення */}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 font-semibold text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Блокування */}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="mb-2 text-lg font-bold text-gray-800">
          Керування доступом
        </h3>

        <p className="mb-5 text-sm text-gray-500">
          Керування доступом учасника до
          тестування в режимі реального часу.
        </p>

        {blocked ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="font-bold text-red-700">
                Тестування заблоковано
              </div>

              <div className="mt-1 text-sm text-red-600">
                Учасник не може продовжувати
                тестування.
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                manageSession("unblock")
              }
              className="
                w-full
                rounded-lg
                bg-green-600
                px-5
                py-3
                font-semibold
                text-white
                transition
                hover:bg-green-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading
                ? "Виконується..."
                : "Розблокувати тестування"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              manageSession("block")
            }
            className="
              w-full
              rounded-lg
              bg-red-600
              px-5
              py-3
              font-semibold
              text-white
              transition
              hover:bg-red-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading
              ? "Виконується..."
              : "Заблокувати тестування"}
          </button>
        )}
      </div>

      {/* Додавання часу */}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="mb-2 text-lg font-bold text-gray-800">
          Додатковий час
        </h3>

        <p className="mb-5 text-sm text-gray-500">
          Додайте час конкретному учаснику
          без переривання тестування.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              manageSession(
                "addTime",
                5
              )
            }
            className="
              rounded-lg
              bg-[#7A1F2B]
              px-5
              py-3
              font-semibold
              text-white
              transition
              hover:bg-[#651923]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            +5 хв
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              manageSession(
                "addTime",
                10
              )
            }
            className="
              rounded-lg
              bg-[#7A1F2B]
              px-5
              py-3
              font-semibold
              text-white
              transition
              hover:bg-[#651923]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            +10 хв
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              manageSession(
                "addTime",
                30
              )
            }
            className="
              rounded-lg
              bg-[#7A1F2B]
              px-5
              py-3
              font-semibold
              text-white
              transition
              hover:bg-[#651923]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            +30 хв
          </button>
        </div>
      </div>
    </div>
  );
}