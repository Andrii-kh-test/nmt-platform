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
        bg-black/80
        flex
        items-center
        justify-center
        p-6
      "
    >
      <div
        className="
          bg-white
          rounded-2xl
          shadow-2xl
          max-w-xl
          w-full
          p-8
        "
      >
        <h2
          className="
            text-3xl
            font-bold
            text-red-700
            mb-6
          "
        >
          Попередження
        </h2>

        <p
          className="
            text-lg
            leading-8
            mb-8
          "
        >
          Ви залишили сторінку тестування
          або перейшли на іншу вкладку.

          <br />
          <br />

          Це є порушенням правил
          проходження тестування.

          <br />
          <br />

          Наступне таке порушення
          автоматично завершить тест.
        </p>

        <button
          type="button"
          onClick={continueTest}
          className="
            w-full
            py-4
            rounded-xl
            bg-[#7A1F2B]
            hover:bg-[#651722]
            text-white
            text-lg
            font-semibold
          "
        >
          Продовжити тестування
        </button>
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
        bg-black/80
        flex
        items-center
        justify-center
        p-6
      "
    >
      <div
        className="
          bg-white
          rounded-2xl
          shadow-2xl
          max-w-xl
          w-full
          p-8
        "
      >
        <h2
          className="
            text-3xl
            font-bold
            text-red-700
            mb-6
          "
        >
          Попередження
        </h2>

        <p
          className="
            text-lg
            leading-8
            mb-8
          "
        >
          Ви залишили сторінку тестування
          або перейшли на іншу вкладку.

          <br />
          <br />

          Це є порушенням правил
          проходження тестування.

          <br />
          <br />

          Наступне таке порушення
          автоматично завершить тест.
        </p>

        <button
          type="button"
          onClick={continueTest}
          className="
            w-full
            py-4
            rounded-xl
            bg-[#7A1F2B]
            hover:bg-[#651722]
            text-white
            text-lg
            font-semibold
          "
        >
          Продовжити тестування
        </button>
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