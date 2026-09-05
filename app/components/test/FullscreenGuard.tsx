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

function OrdinaryFullscreenGuard({
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
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch(() => {});
    }

    const handleFullscreen = async () => {
      if (document.fullscreenElement) {
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
          "Не знайдено testSessionId"
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
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreen
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreen
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

  async function returnFullscreen() {
    setShowWarning(false);

    try {
      await document.documentElement.requestFullscreen();
    } catch {}
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
        bg-black/60
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
          Ви вийшли з
          повноекранного режиму.

          <br />
          <br />

          Це є порушенням правил
          проходження тестування.

          <br />
          <br />

          Повторне порушення
          автоматично завершить тест.
        </p>

        <button
          type="button"
          onClick={returnFullscreen}
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
          Повернутися до тестування
        </button>
      </div>
    </div>
  );
}

function CombinedFullscreenGuard({
  onViolationFinish,
}: Props) {
  const [violations, setViolations] =
    useState(0);

  const [showWarning, setShowWarning] =
    useState(false);

  useEffect(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch(() => {});
    }

    const handleFullscreen = async () => {
      if (document.fullscreenElement) {
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
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreen
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreen
      );
    };
  }, [
    violations,
    onViolationFinish,
  ]);

  async function returnFullscreen() {
    setShowWarning(false);

    try {
      await document.documentElement.requestFullscreen();
    } catch {}
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
        bg-black/60
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
          Ви вийшли з
          повноекранного режиму.

          <br />
          <br />

          Це є порушенням правил
          проходження тестування.

          <br />
          <br />

          Повторне порушення
          автоматично завершить тест.
        </p>

        <button
          type="button"
          onClick={returnFullscreen}
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
          Повернутися до тестування
        </button>
      </div>
    </div>
  );
}

export default function FullscreenGuard({
  onViolationFinish,
}: Props) {
  /*
   * Якщо callback передано —
   * це комбінований тест.
   *
   * ВАЖЛИВО:
   * OrdinaryFullscreenGuard у цьому випадку
   * взагалі не монтується, тому useTestSession()
   * не викликається.
   */

  if (onViolationFinish) {
    return (
      <CombinedFullscreenGuard
        onViolationFinish={onViolationFinish}
      />
    );
  }

  /*
   * Звичайний тест.
   */

  return (
    <OrdinaryFullscreenGuard
      onViolationFinish={async () => {}}
    />
  );
}