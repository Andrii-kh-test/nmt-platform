"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useTestSession } from "@/app/context/TestSessionContext";
import { finishTest } from "@/app/services/testEngine";

export default function TestSecurityGuard() {
  const router = useRouter();

  const {
    sessionId,
    test,
    savedAnswers,
    timeLeft,
  } = useTestSession();

  // =====================================================
  // STATE
  // =====================================================

  const [warningVisible, setWarningVisible] = useState(false);

  // =====================================================
  // REFS
  // =====================================================

  const violationsRef = useRef(0);
  const finishingRef = useRef(false);

  const sessionIdRef = useRef<number | null>(sessionId);
  const testRef = useRef(test);
  const savedAnswersRef = useRef(savedAnswers);
  const timeLeftRef = useRef(timeLeft);

  // Оновлюємо refs без повторної реєстрації event listeners
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    testRef.current = test;
  }, [test]);

  useEffect(() => {
    savedAnswersRef.current = savedAnswers;
  }, [savedAnswers]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // =====================================================
  // VIOLATION
  // =====================================================

  const registerViolation = () => {
    if (finishingRef.current) {
      return;
    }

    violationsRef.current += 1;

    // ===================================================
    // ПЕРШЕ ПОРУШЕННЯ
    // ===================================================

    if (violationsRef.current === 1) {
      setWarningVisible(true);
      return;
    }

    // ===================================================
    // ДРУГЕ ПОРУШЕННЯ
    // ===================================================

    if (violationsRef.current >= 2) {
      finishingRef.current = true;

      const currentTest = testRef.current;
      const currentSessionId = sessionIdRef.current;

      if (!currentTest || !currentSessionId) {
        return;
      }

      void finishTest(
        "security",
        currentTest,
        savedAnswersRef.current,
        timeLeftRef.current,
        currentSessionId,
        router
      );
    }
  };

  // =====================================================
  // SECURITY EVENTS
  // =====================================================

  useEffect(() => {
    // ---------------------------------------------------
    // ПРАВИЙ КЛІК
    // ---------------------------------------------------

    // ---------------------------------------------------
    // ВИДІЛЕННЯ ТЕКСТУ
    //
    // Блокуємо тихо.
    // НЕ є порушенням.
    // ---------------------------------------------------

    const handleSelectStart = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    // ---------------------------------------------------
    // DRAG
    //
    // Блокуємо тихо.
    // НЕ є порушенням.
    // ---------------------------------------------------

    const handleDragStart = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    // ---------------------------------------------------
    // КЛАВІАТУРА
    // ---------------------------------------------------

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // =================================================
      // Ctrl+C
      // =================================================

      if (event.ctrlKey && key === "c") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+X
      // =================================================

      if (event.ctrlKey && key === "x") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+V
      // =================================================

      if (event.ctrlKey && key === "v") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+U
      // =================================================

      if (event.ctrlKey && key === "u") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+P
      // =================================================

      if (event.ctrlKey && key === "p") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+S
      // =================================================

      if (event.ctrlKey && key === "s") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+Shift+C
      // Ctrl+Shift+I
      // Ctrl+Shift+J
      // =================================================

      if (
        event.ctrlKey &&
        event.shiftKey &&
        (key === "c" || key === "i" || key === "j")
      ) {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // F12
      // =================================================

      if (event.key === "F12") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // PRINT SCREEN
      // =================================================

      if (event.key === "PrintScreen") {
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

      // =================================================
      // WINDOWS / META
      //
      // Браузер може отримати Meta.
      // Якщо отримав — реєструємо порушення.
      // =================================================

      if (event.metaKey) {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+L
      // Адресний рядок
      // =================================================

      if (event.ctrlKey && key === "l") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+T
      // Нова вкладка
      // =================================================

      if (event.ctrlKey && key === "t") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+N
      // Нове вікно
      // =================================================

      if (event.ctrlKey && key === "n") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+W
      // Закриття вкладки
      // =================================================

      if (event.ctrlKey && key === "w") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+Shift+W
      // =================================================

      if (
        event.ctrlKey &&
        event.shiftKey &&
        key === "w"
      ) {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Ctrl+Tab
      // Перемикання вкладок
      // =================================================

      if (event.ctrlKey && event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Alt + ←
      // Назад
      // =================================================

      if (
        event.altKey &&
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }

      // =================================================
      // Alt + →
      // Вперед
      // =================================================

      if (
        event.altKey &&
        event.key === "ArrowRight"
      ) {
        event.preventDefault();
        event.stopPropagation();

        registerViolation();
        return;
      }
    };

    // =====================================================
    // COPY
    //
    // Блокуємо тихо.
    // НЕ є порушенням.
    // =====================================================

    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    // =====================================================
    // CUT
    //
    // Блокуємо тихо.
    // НЕ є порушенням.
    // =====================================================

    const handleCut = (event: ClipboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    // =====================================================
    // PASTE
    //
    // Блокуємо тихо.
    // НЕ є порушенням.
    // =====================================================

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    // =====================================================
    // LISTENERS
    // =====================================================

  

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

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {

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

  // =====================================================
  // WARNING CARD
  // =====================================================

  if (!warningVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.72)",
        padding: "24px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "620px",
          overflow: "hidden",
          borderRadius: "24px",
          background: "#7A1F2B",
          color: "#ffffff",
          padding: "48px 42px 42px",
          textAlign: "center",
          boxShadow:
            "0 25px 80px rgba(0, 0, 0, 0.45)",
        }}
      >
        {/* Декоративні кола */}

        <div
          style={{
            position: "absolute",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            top: "-80px",
            right: "-60px",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "130px",
            height: "130px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            bottom: "-55px",
            left: "-45px",
          }}
        />

        {/* Значок */}

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "92px",
            height: "92px",
            margin: "0 auto 26px",
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "58px",
            fontWeight: 800,
            lineHeight: 1,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          !
        </div>

        {/* Заголовок */}

        <h2
          style={{
            position: "relative",
            zIndex: 1,
            margin: "0 0 18px",
            fontSize: "30px",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Порушення правила тестування
        </h2>

        {/* Текст */}

        <p
          style={{
            position: "relative",
            zIndex: 1,
            margin: "0 auto 32px",
            maxWidth: "500px",
            fontSize: "18px",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.94)",
          }}
        >
          Дотримуйтеся правил проходження
          тестування. Повторне порушення
          автоматично завершить тест
        </p>

        {/* Кнопка */}

        <button
          type="button"
          onClick={() => {
            setWarningVisible(false);
          }}
          style={{
            position: "relative",
            zIndex: 1,
            border: "none",
            borderRadius: "12px",
            background: "#ffffff",
            color: "#7A1F2B",
            padding: "14px 28px",
            fontSize: "17px",
            fontWeight: 700,
            cursor: "pointer",
            minWidth: "250px",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
          Повернутися до тестування
        </button>
      </div>
    </div>
  );
}