"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  sessionId: number;
  testId: number;
  blocked: boolean;
};

type Action =
  | "block"
  | "unblock"
  | "addTime"
  | "invalidate";

export default function MonitoringControls({
  sessionId,
  testId,
  blocked: initialBlocked,
}: Props) {
  const router = useRouter();

  const [blocked, setBlocked] =
    useState(initialBlocked);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [invalidated, setInvalidated] =
    useState(false);

  // =====================================================
  // КЕРУВАННЯ СЕСІЄЮ
  // =====================================================

  async function manageSession(
    action: Action,
    minutes?: number
  ) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      console.log(
        "ADMIN MANAGE REQUEST:",
        {
          sessionId,
          testId,
          action,
          minutes,
        }
      );

      const response = await fetch(
        `/api/session/manage/${sessionId}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action,

            ...(minutes !== undefined
              ? {
                  minutes,
                }
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

      const data =
        await response.json();

      console.log(
        "ADMIN MANAGE RESPONSE:",
        {
          status: response.status,
          ok: response.ok,
          data,
        }
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Не вдалося виконати операцію."
        );
      }

      // =================================================
      // БЛОКУВАННЯ
      // =================================================

      if (action === "block") {
        setBlocked(true);

        setMessage(
          "Тестування заблоковано."
        );
      }

      // =================================================
      // РОЗБЛОКУВАННЯ
      // =================================================

      if (action === "unblock") {
        setBlocked(false);

        setMessage(
          "Тестування розблоковано."
        );
      }

      // =================================================
      // ДОДАВАННЯ ЧАСУ
      // =================================================

      if (action === "addTime") {
        setMessage(
          `Додано ${minutes} хвилин.`
        );
      }

      // =================================================
      // АНУЛЮВАННЯ РЕЗУЛЬТАТУ
      // =================================================

      if (action === "invalidate") {
        setInvalidated(true);

        setBlocked(true);

        setMessage(
          "Результат анульовано. Учаснику буде показано результат 0 балів із причиною «Порушення правил тестування»."
        );

        // Даємо повідомленню відобразитися,
        // після чого оновлюємо сторінку адміністратора.
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      console.error(
        "ADMIN MANAGE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Сталася помилка."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // АНУЛЮВАННЯ
  // =====================================================

  function handleInvalidate() {
    const confirmed =
      window.confirm(
        "Ви впевнені, що хочете анулювати результат цього учасника?\n\n" +
          "Результат буде збережено як 0 балів із причиною завершення «Порушення правил тестування».\n\n" +
          "Після анулювання продовжити тестування буде неможливо."
      );

    if (!confirmed) {
      return;
    }

    manageSession("invalidate");
  }

  // =====================================================
  // АВТОМАТИЧНО ПРИБИРАЄМО ПОВІДОМЛЕННЯ
  // =====================================================

  useEffect(() => {
    if (!message && !error) {
      return;
    }

    const timer =
      setTimeout(() => {
        setMessage("");
        setError("");
      }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [message, error]);

  return (
    <div className="space-y-6">
      {/* =================================================
          ПОВІДОМЛЕННЯ
      ================================================= */}

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

      {/* =================================================
          СТАН АНУЛЬОВАНОГО РЕЗУЛЬТАТУ
      ================================================= */}

      {invalidated && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-5">
          <div className="text-xl font-bold text-red-700">
            Результат анульовано
          </div>

          <p className="mt-2 text-sm leading-6 text-red-600">
            Результат учасника збережено як
            0 балів. Причина завершення:
            «Порушення правил тестування».
          </p>
        </div>
      )}

      {/* =================================================
          КЕРУВАННЯ ДОСТУПОМ
      ================================================= */}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="mb-2 text-lg font-bold text-gray-800">
          Керування доступом
        </h3>

        <p className="mb-5 text-sm leading-6 text-gray-500">
          Керування доступом учасника до
          тестування в режимі реального
          часу.
        </p>

        {invalidated ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="font-bold text-red-700">
              Тестування завершено
            </div>

            <div className="mt-1 text-sm text-red-600">
              Результат учасника анульовано
              через порушення правил
              тестування.
            </div>
          </div>
        ) : blocked ? (
          <div className="space-y-4">
            {/* СТАН БЛОКУВАННЯ */}

            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="font-bold text-red-700">
                Тестування заблоковано
              </div>

              <div className="mt-1 text-sm leading-6 text-red-600">
                Учасник не може продовжувати
                тестування, доки сесію не буде
                розблоковано або анульовано.
              </div>
            </div>

            {/* АНУЛЮВАННЯ */}

            <button
              type="button"
              disabled={loading}
              onClick={
                handleInvalidate
              }
              className="
                w-full
                rounded-lg
                bg-red-700
                px-5
                py-3
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-red-800
                hover:shadow-md
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading
                ? "Виконується..."
                : "Анулювати результат"}
            </button>

            {/* РОЗБЛОКУВАННЯ */}

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                manageSession(
                  "unblock"
                )
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
          /* БЛОКУВАННЯ */

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

      {/* =================================================
          ДОДАТКОВИЙ ЧАС
      ================================================= */}

      {!invalidated && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="mb-2 text-lg font-bold text-gray-800">
            Додатковий час
          </h3>

          <p className="mb-5 text-sm leading-6 text-gray-500">
            Додайте час конкретному
            учаснику без переривання
            тестування.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* +5 */}

            <button
              type="button"
              disabled={
                loading || blocked
              }
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
              {loading
                ? "..."
                : "+5 хв"}
            </button>

            {/* +10 */}

            <button
              type="button"
              disabled={
                loading || blocked
              }
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
              {loading
                ? "..."
                : "+10 хв"}
            </button>

            {/* +30 */}

            <button
              type="button"
              disabled={
                loading || blocked
              }
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
              {loading
                ? "..."
                : "+30 хв"}
            </button>
          </div>

          {blocked && (
            <p className="mt-4 text-sm text-gray-500">
              Додавання часу недоступне,
              поки тестування заблоковано.
            </p>
          )}
        </div>
      )}
    </div>
  );
}