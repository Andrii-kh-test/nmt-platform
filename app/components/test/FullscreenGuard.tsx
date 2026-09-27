"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTestSession } from "@/app/context/TestSessionContext";
import { finishTest } from "@/app/services/testEngine";

type Props = {
  onViolationFinish?: () => Promise<void>;
};

function WarningCard({
  onReturn,
}: {
  onReturn: () => void;
}) {
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
        p-6
        backdrop-blur-sm
      "
    >
      <div
        className="
          relative
          w-full
          max-w-xl
          overflow-hidden
          rounded-[28px]
          bg-white
          shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]
        "
      >
        {/* =====================================================
            ДЕКОРАТИВНА БОРДОВА ЗОНА
        ===================================================== */}

        <div
          className="
            relative
            h-48
            overflow-hidden
            bg-[#7A1F2B]
          "
        >
          {/* Великий напівпрозорий знак оклику */}

          <div
            className="
              pointer-events-none
              absolute
              -right-2
              -top-20
              select-none
              text-[300px]
              font-black
              leading-none
              text-white/[0.08]
            "
          >
            !
          </div>

          {/* Білі напівпрозорі кола */}

          <div
            className="
              pointer-events-none
              absolute
              -left-20
              -top-24
              h-64
              w-64
              rounded-full
              border
              border-white/[0.12]
              bg-white/[0.04]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-28
              left-24
              h-52
              w-52
              rounded-full
              border
              border-white/[0.10]
              bg-white/[0.04]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -right-16
              bottom-[-90px]
              h-56
              w-56
              rounded-full
              border
              border-white/[0.10]
              bg-white/[0.03]
            "
          />

          {/* Маленьке коло-акцент */}

          <div
            className="
              pointer-events-none
              absolute
              left-10
              top-10
              h-5
              w-5
              rounded-full
              bg-white/20
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              left-20
              top-20
              h-2.5
              w-2.5
              rounded-full
              bg-white/30
            "
          />
        </div>

        {/* =====================================================
            ОСНОВНИЙ ВМІСТ
        ===================================================== */}

        <div className="relative px-8 pb-8 pt-7 sm:px-10 sm:pb-10">
          {/* Великий напівпрозорий знак оклику
              на білій частині картки */}

          <div
            className="
              pointer-events-none
              absolute
              -right-3
              -top-20
              select-none
              text-[300px]
              font-black
              leading-none
              text-[#7A1F2B]/[0.035]
            "
          >
            !
          </div>

          <div className="relative">
            {/* Заголовок */}

            <h2
              className="
                text-2xl
                font-bold
                leading-tight
                text-[#7A1F2B]
                sm:text-[28px]
              "
            >
              Порушення правила тестування
            </h2>

            {/* Основний текст */}

            <p
              className="
                mt-4
                max-w-lg
                text-base
                leading-7
                text-gray-600
              "
            >
              Дотримуйтеся правил проходження
              тестування. Повторне порушення
              автоматично завершить тест
            </p>

            {/* Кнопка */}

            <button
              type="button"
              onClick={onReturn}
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
              Повернутися до тестування
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdinaryFullscreenGuard() {
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

      // =====================================================
      // ПЕРШЕ ПОРУШЕННЯ
      // =====================================================

      if (nextViolations === 1) {
        setShowWarning(true);
        return;
      }

      // =====================================================
      // ДРУГЕ ПОРУШЕННЯ
      // Автоматичне завершення тесту
      // =====================================================

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
          "Помилка завершення тесту після порушення:",
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
    <WarningCard
      onReturn={returnFullscreen}
    />
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

      if (nextViolations === 1) {
        setShowWarning(true);
        return;
      }

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
    <WarningCard
      onReturn={returnFullscreen}
    />
  );
}

export default function FullscreenGuard({
  onViolationFinish,
}: Props) {
  if (onViolationFinish) {
    return (
      <CombinedFullscreenGuard
        onViolationFinish={onViolationFinish}
      />
    );
  }

  return (
    <OrdinaryFullscreenGuard />
  );
}