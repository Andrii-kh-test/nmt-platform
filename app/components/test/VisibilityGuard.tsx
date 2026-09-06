"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTestSession } from "@/app/context/TestSessionContext";
import { finishTest } from "@/app/services/testEngine";

type Props = {
  onViolationFinish?: () => Promise<void>;
};

type OrdinaryGuardProps = {
  onViolationFinish: () => Promise<void>;
};

/*
 * =========================================================
 * ЗВИЧАЙНИЙ ТЕСТ
 * =========================================================
 */

function OrdinaryVisibilityGuard({
  onViolationFinish,
}: OrdinaryGuardProps) {
  const router = useRouter();

  const {
    test,
    savedAnswers,
    timeLeft,
  } = useTestSession();

  const [violations, setViolations] =
    useState(0);

  const [showWarning, setShowWarning] =
    useState(false);

  useEffect(() => {
    async function handleVisibility() {
      if (!document.hidden) {
        return;
      }

      const nextViolations =
        violations + 1;

      setViolations(nextViolations);

      /*
       * =====================================================
       * ПЕРШЕ ПОРУШЕННЯ
       * =====================================================
       */

      if (nextViolations === 1) {
        setShowWarning(true);
        return;
      }

      /*
       * =====================================================
       * ДРУГЕ ПОРУШЕННЯ
       * =====================================================
       */

      if (onViolationFinish) {
        try {
          await onViolationFinish();
        } catch (error) {
          console.error(
            "Помилка завершення тесту після порушення:",
            error
          );
        }

        return;
      }

      /*
       * =====================================================
       * ЗВИЧАЙНИЙ ТЕСТ
       * =====================================================
       */

      if (!test) {
        return;
      }

      const storedSessionId =
        localStorage.getItem(
          "testSessionId"
        );

      const sessionId =
        Number(storedSessionId);

      if (!sessionId) {
        console.error(
          "Не знайдено sessionId тестування"
        );

        return;
      }

      try {
        await finishTest(
          "security",
          test,
          savedAnswers,
          timeLeft,
          sessionId,
          router
        );
      } catch (error) {
        console.error(
          "Помилка завершення тесту:",
          error
        );
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [
    violations,
    test,
    savedAnswers,
    timeLeft,
    router,
    onViolationFinish,
  ]);

  function continueTest() {
    setShowWarning(false);
  }

  if (!showWarning) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        bg-slate-900/65
        backdrop-blur-sm
        p-6
      "
    >
      <div
        className="
          w-full
          max-w-lg
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)]
        "
      >
        {/* Верхній акцент */}
        <div className="h-1.5 bg-[#F97316]" />

        <div className="p-8">
          {/* Заголовок */}
          <div className="flex items-start gap-5">
            <div
              className="
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-orange-50
                text-orange-500
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-7 w-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 17h.01"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m10.29 3.86-8.47 14.14a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                />
              </svg>
            </div>

            <div className="pt-0.5">
              <h2 className="text-2xl font-bold text-[#7A1F2B]">
                Попередження
              </h2>

              <p className="mt-1 text-sm font-medium text-gray-500">
                Зафіксовано порушення правил тестування
              </p>
            </div>
          </div>

          {/* Текст попередження */}
          <div
            className="
              mt-7
              rounded-xl
              border
              border-orange-100
              bg-orange-50/60
              px-5
              py-4
            "
          >
            <p className="text-base leading-7 text-gray-700">
              Ви залишили сторінку тестування
              або перейшли на іншу вкладку.
            </p>

            <p className="mt-3 text-base leading-7 text-gray-700">
              Це є порушенням правил
              проходження тестування.
            </p>

            <div className="my-4 border-t border-orange-100" />

            <p className="text-base font-semibold leading-7 text-gray-800">
              Наступне таке порушення
              автоматично завершить тест.
            </p>
          </div>

          {/* Кнопка */}
          <button
            type="button"
            onClick={continueTest}
            className="
              mt-7
              w-full
              rounded-xl
              bg-[#7A1F2B]
              px-6
              py-3.5
              text-base
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-[#651722]
              hover:shadow-md
              focus:outline-none
              focus:ring-2
              focus:ring-[#7A1F2B]/30
              active:scale-[0.99]
            "
          >
            Продовжити тестування
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">
            Будь ласка, залишайтеся на сторінці тестування
          </p>
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * КОМБІНОВАНИЙ ТЕСТ
 *
 * Тут НЕ використовується useTestSession().
 * =========================================================
 */

function CombinedVisibilityGuard({
  onViolationFinish,
}: Props) {
  const [violations, setViolations] =
    useState(0);

  const [showWarning, setShowWarning] =
    useState(false);

  useEffect(() => {
    async function handleVisibility() {
      if (!document.hidden) {
        return;
      }

      const nextViolations =
        violations + 1;

      setViolations(nextViolations);

      /*
       * =====================================================
       * ПЕРШЕ ПОРУШЕННЯ
       * =====================================================
       */

      if (nextViolations === 1) {
        setShowWarning(true);
        return;
      }

      /*
       * =====================================================
       * ДРУГЕ ПОРУШЕННЯ
       * =====================================================
       */

      if (onViolationFinish) {
        try {
          await onViolationFinish();
        } catch (error) {
          console.error(
            "Помилка завершення комбінованого тесту:",
            error
          );
        }
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [
    violations,
    onViolationFinish,
  ]);

  function continueTest() {
    setShowWarning(false);
  }

  if (!showWarning) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        bg-slate-900/65
        backdrop-blur-sm
        p-6
      "
    >
      <div
        className="
          w-full
          max-w-lg
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)]
        "
      >
        {/* Верхній акцент */}
        <div className="h-1.5 bg-[#F97316]" />

        <div className="p-8">
          {/* Заголовок */}
          <div className="flex items-start gap-5">
            <div
              className="
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-orange-50
                text-orange-500
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-7 w-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 17h.01"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m10.29 3.86-8.47 14.14a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                />
              </svg>
            </div>

            <div className="pt-0.5">
              <h2 className="text-2xl font-bold text-[#7A1F2B]">
                Попередження
              </h2>

              <p className="mt-1 text-sm font-medium text-gray-500">
                Зафіксовано порушення правил тестування
              </p>
            </div>
          </div>

          {/* Текст попередження */}
          <div
            className="
              mt-7
              rounded-xl
              border
              border-orange-100
              bg-orange-50/60
              px-5
              py-4
            "
          >
            <p className="text-base leading-7 text-gray-700">
              Ви залишили сторінку тестування
              або перейшли на іншу вкладку.
            </p>

            <p className="mt-3 text-base leading-7 text-gray-700">
              Це є порушенням правил
              проходження тестування.
            </p>

            <div className="my-4 border-t border-orange-100" />

            <p className="text-base font-semibold leading-7 text-gray-800">
              Наступне таке порушення
              автоматично завершить тест.
            </p>
          </div>

          {/* Кнопка */}
          <button
            type="button"
            onClick={continueTest}
            className="
              mt-7
              w-full
              rounded-xl
              bg-[#7A1F2B]
              px-6
              py-3.5
              text-base
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-[#651722]
              hover:shadow-md
              focus:outline-none
              focus:ring-2
              focus:ring-[#7A1F2B]/30
              active:scale-[0.99]
            "
          >
            Продовжити тестування
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">
            Будь ласка, залишайтеся на сторінці тестування
          </p>
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * ГОЛОВНИЙ КОМПОНЕНТ
 * =========================================================
 */

export default function VisibilityGuard({
  onViolationFinish,
}: Props) {
  /*
   * Якщо callback передано —
   * працюємо в режимі комбінованого тесту.
   *
   * useTestSession() у цьому випадку
   * взагалі не викликається.
   */

  if (onViolationFinish) {
    return (
      <CombinedVisibilityGuard
        onViolationFinish={onViolationFinish}
      />
    );
  }

  /*
   * Звичайний тест.
   */

  return (
    <OrdinaryVisibilityGuard
      onViolationFinish={async () => {}}
    />
  );
}