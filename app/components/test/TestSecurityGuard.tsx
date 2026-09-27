"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  useTestSession,
} from "@/app/context/TestSessionContext";

import { finishTest } from "@/app/services/testEngine";

export default function TestSecurityGuard() {
  const router = useRouter();

  const {
    sessionId,
    test,
    savedAnswers,
    timeLeft,
  } = useTestSession();

  // =========================================================
  // ПОПЕРЕДЖЕННЯ
  // =========================================================

  const [warningVisible, setWarningVisible] =
    useState(false);

  const warningVisibleRef =
    useRef(false);

  // =========================================================
  // КІЛЬКІСТЬ ПОРУШЕНЬ
  // =========================================================

  const violationsRef =
    useRef(0);

  // =========================================================
  // ЗАХИСТ ВІД ПОДВІЙНОГО ЗАВЕРШЕННЯ
  // =========================================================

  const finishingRef =
    useRef(false);

  // =========================================================
  // АКТУАЛЬНІ ДАНІ СЕСІЇ
  //
  // Обробники клавіатури створюються один раз.
  // Тому беремо актуальні значення через ref.
  // =========================================================

  const sessionIdRef =
    useRef(sessionId);

  const testRef =
    useRef(test);

  const savedAnswersRef =
    useRef(savedAnswers);

  const timeLeftRef =
    useRef(timeLeft);

  useEffect(() => {
    sessionIdRef.current =
      sessionId;
  }, [sessionId]);

  useEffect(() => {
    testRef.current =
      test;
  }, [test]);

  useEffect(() => {
    savedAnswersRef.current =
      savedAnswers;
  }, [savedAnswers]);

  useEffect(() => {
    timeLeftRef.current =
      timeLeft;
  }, [timeLeft]);

  // =========================================================
  // ПОКАЗ ПОПЕРЕДЖЕННЯ
  // =========================================================

  const showWarning = () => {
    if (
      warningVisibleRef.current ||
      finishingRef.current
    ) {
      return;
    }

    warningVisibleRef.current =
      true;

    setWarningVisible(true);
  };

  // =========================================================
  // ПРИМУСОВЕ ЗАВЕРШЕННЯ
  // =========================================================

  const finishForViolation =
    async () => {
      if (finishingRef.current) {
        return;
      }

      finishingRef.current =
        true;

      const currentTest =
        testRef.current;

      const currentSessionId =
        Number(
          sessionIdRef.current
        );

      const currentTimeLeft =
        Number(
          timeLeftRef.current ?? 0
        );

      if (!currentTest) {
        console.error(
          "SECURITY: відсутній test."
        );

        finishingRef.current =
          false;

        return;
      }

      if (
        !Number.isInteger(
          currentSessionId
        ) ||
        currentSessionId <= 0
      ) {
        console.error(
          "SECURITY: відсутній або некоректний sessionId."
        );

        finishingRef.current =
          false;

        return;
      }

      try {
        console.warn(
          "SECURITY: друге порушення. Тест буде автоматично завершено."
        );

        await finishTest(
          "security",
          currentTest,
          savedAnswersRef.current,
          currentTimeLeft,
          currentSessionId,
          router
        );
      } catch (error) {
        console.error(
          "SECURITY: помилка примусового завершення:",
          error
        );

        finishingRef.current =
          false;
      }
    };

  // =========================================================
  // ФІКСАЦІЯ ПОРУШЕННЯ
  // =========================================================

  const registerViolation =
    () => {
      if (
        finishingRef.current ||
        warningVisibleRef.current
      ) {
        return;
      }

      violationsRef.current += 1;

      console.warn(
        "SECURITY: порушення №",
        violationsRef.current
      );

      // =====================================================
      // ПЕРШЕ ПОРУШЕННЯ
      // =====================================================

      if (
        violationsRef.current === 1
      ) {
        showWarning();

        return;
      }

      // =====================================================
      // ДРУГЕ ПОРУШЕННЯ
      // =====================================================

      if (
        violationsRef.current >= 2
      ) {
        void finishForViolation();
      }
    };

  // =========================================================
  // ПОВЕРНЕННЯ ДО ТЕСТУ
  // =========================================================

  const returnToTest =
    () => {
      warningVisibleRef.current =
        false;

      setWarningVisible(false);
    };

  // =========================================================
  // SECURITY LISTENERS
  // =========================================================

  useEffect(() => {
    // =======================================================
    // КОНТЕКСТНЕ МЕНЮ
    // =======================================================

    const handleContextMenu =
      (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
      };

    // =======================================================
    // ВИДІЛЕННЯ ТЕКСТУ
    // =======================================================

    const handleSelectStart =
      (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
      };

    // =======================================================
    // ПЕРЕТЯГУВАННЯ
    // =======================================================

    const handleDragStart =
      (event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
      };

    // =======================================================
    // КЛАВІАТУРА
    // =======================================================

    const handleKeyDown =
      (event: KeyboardEvent) => {
        const key =
          event.key.toLowerCase();

        const ctrl =
          event.ctrlKey;

        const shift =
          event.shiftKey;

        const alt =
          event.altKey;

        const meta =
          event.metaKey;

        // ===================================================
        // CTRL+C
        // ===================================================

        if (
          ctrl &&
          key === "c"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+X
        // ===================================================

        if (
          ctrl &&
          key === "x"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+V
        // ===================================================

        if (
          ctrl &&
          key === "v"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+U
        // ===================================================

        if (
          ctrl &&
          key === "u"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+P
        // ===================================================

        if (
          ctrl &&
          key === "p"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+S
        // ===================================================

        if (
          ctrl &&
          key === "s"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+SHIFT+C
        // CTRL+SHIFT+I
        // CTRL+SHIFT+J
        // ===================================================

        if (
          ctrl &&
          shift &&
          (
            key === "c" ||
            key === "i" ||
            key === "j"
          )
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // F12
        // ===================================================

        if (
          event.key === "F12"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // PRINT SCREEN
        // ===================================================

        if (
          event.key === "PrintScreen"
        ) {
          event.preventDefault();
          event.stopPropagation();

          document.documentElement.classList.add(
            "screenshot-protection-active"
          );

          window.setTimeout(() => {
            document.documentElement.classList.remove(
              "screenshot-protection-active"
            );
          }, 1200);

          registerViolation();

          return;
        }

        // ===================================================
        // WINDOWS / META
        // ===================================================

        if (meta) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+L
        // ===================================================

        if (
          ctrl &&
          key === "l"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+T
        // ===================================================

        if (
          ctrl &&
          key === "t"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+N
        // ===================================================

        if (
          ctrl &&
          key === "n"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+W
        // ===================================================

        if (
          ctrl &&
          key === "w"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+SHIFT+W
        // ===================================================

        if (
          ctrl &&
          shift &&
          key === "w"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // CTRL+TAB
        // ===================================================

        if (
          ctrl &&
          key === "tab"
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }

        // ===================================================
        // ALT+LEFT / ALT+RIGHT
        // ===================================================

        if (
          alt &&
          (
            key === "arrowleft" ||
            key === "arrowright"
          )
        ) {
          event.preventDefault();
          event.stopPropagation();

          registerViolation();

          return;
        }
      };

    // =======================================================
    // COPY
    // =======================================================

    const handleCopy =
      (event: ClipboardEvent) => {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
      };

    // =======================================================
    // CUT
    // =======================================================

    const handleCut =
      (event: ClipboardEvent) => {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
      };

    // =======================================================
    // PASTE
    // =======================================================

    const handlePaste =
      (event: ClipboardEvent) => {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
      };

    // =======================================================
    // ПІДКЛЮЧЕННЯ
    // =======================================================

    document.addEventListener(
      "contextmenu",
      handleContextMenu
    );

    document.addEventListener(
      "selectstart",
      handleSelectStart
    );

    document.addEventListener(
      "dragstart",
      handleDragStart
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
      true
    );

    document.addEventListener(
      "copy",
      handleCopy
    );

    document.addEventListener(
      "cut",
      handleCut
    );

    document.addEventListener(
      "paste",
      handlePaste
    );

    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {
      document.removeEventListener(
        "contextmenu",
        handleContextMenu
      );

      document.removeEventListener(
        "selectstart",
        handleSelectStart
      );

      document.removeEventListener(
        "dragstart",
        handleDragStart
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
        true
      );

      document.removeEventListener(
        "copy",
        handleCopy
      );

      document.removeEventListener(
        "cut",
        handleCut
      );

      document.removeEventListener(
        "paste",
        handlePaste
      );
    };
  }, []);

  // =========================================================
  // WARNING CARD
  // =========================================================

  if (!warningVisible) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[99999]
        flex
        items-center
        justify-center
        bg-[#7A1F2B]
        overflow-hidden
      "
    >
      {/* ===================================================
          ДЕКОРАТИВНІ КОЛА
         =================================================== */}

      <div
        className="
          absolute
          -top-32
          -left-32
          w-96
          h-96
          rounded-full
          bg-white/10
        "
      />

      <div
        className="
          absolute
          -bottom-40
          -right-40
          w-[500px]
          h-[500px]
          rounded-full
          bg-white/10
        "
      />

      {/* ===================================================
          ВЕЛИКИЙ ЗНАК ОКЛИКУ
         =================================================== */}

      <div
        className="
          absolute
          text-[28rem]
          leading-none
          font-black
          text-white/5
          select-none
          pointer-events-none
        "
      >
        !
      </div>

      {/* ===================================================
          КАРТКА
         =================================================== */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-2xl
          mx-6
          rounded-3xl
          bg-white
          shadow-2xl
          p-10
          text-center
        "
      >
        <div
          className="
            mx-auto
            mb-7
            flex
            h-20
            w-20
            items-center
            justify-center
            rounded-full
            bg-[#7A1F2B]
            text-5xl
            font-black
            text-white
          "
        >
          !
        </div>

        <h2
          className="
            text-3xl
            font-bold
            text-[#7A1F2B]
            mb-5
          "
        >
          Порушення правила тестування
        </h2>

        <p
          className="
            text-lg
            leading-relaxed
            text-gray-700
            mb-8
          "
        >
          Дотримуйтеся правил проходження
          тестування. Повторне порушення
          автоматично завершить тест
        </p>

        <button
          type="button"
          onClick={returnToTest}
          className="
            w-full
            rounded-xl
            bg-[#7A1F2B]
            px-6
            py-4
            text-lg
            font-semibold
            text-white
            transition
            hover:bg-[#641923]
            active:scale-[0.99]
          "
        >
          Повернутися до тестування
        </button>
      </div>
    </div>
  );
}