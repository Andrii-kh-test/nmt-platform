"use client";

import { useEffect, useRef } from "react";

import {
  useComplexTestSession,
} from "@/app/context/ComplexTestSessionContext";

interface ComplexAutoSaveSessionProps {
  complexTestId: number;
  sessionId: number;
  interval?: number;
}

export default function ComplexAutoSaveSession({
  complexTestId,
  sessionId,
  interval = 30000,
}: ComplexAutoSaveSessionProps) {
  const {
    currentTestId,
    currentQuestion,
    savedAnswers,
    blocked,
    finished,
  } = useComplexTestSession();

  const savingRef = useRef(false);

  /*
   * =========================================================
   * Збереження сесії
   * =========================================================
   */

  async function saveSession() {
    if (
      savingRef.current ||
      blocked ||
      finished ||
      !currentTestId
    ) {
      return;
    }

    savingRef.current = true;

    try {
      const response = await fetch(
        `/api/complex-tests/${complexTestId}/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            sessionId,
            currentTestId,
            currentQuestion,
            savedAnswers,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(
          () => null
        );

        console.error(
          "COMPLEX AUTO SAVE ERROR:",
          data?.message ||
            `HTTP ${response.status}`
        );
      }
    } catch (error) {
      /*
       * Втрата інтернету не повинна
       * ламати проходження тесту.
       *
       * Наступна автоматична спроба
       * виконає синхронізацію.
       */

      console.error(
        "COMPLEX AUTO SAVE:",
        error
      );
    } finally {
      savingRef.current = false;
    }
  }

  /*
   * =========================================================
   * Періодичне автозбереження
   * =========================================================
   */

  useEffect(() => {
    if (
      blocked ||
      finished ||
      !currentTestId
    ) {
      return;
    }

    const timer = window.setInterval(
      () => {
        void saveSession();
      },
      interval
    );

    return () => {
      window.clearInterval(timer);
    };
  }, [
    interval,
    blocked,
    finished,
    currentTestId,
    currentQuestion,
    savedAnswers,
  ]);

  /*
   * =========================================================
   * Збереження перед приховуванням сторінки
   * =========================================================
   *
   * visibilitychange спрацьовує, коли користувач:
   * - перемикає вкладку;
   * - мінімізує браузер;
   * - переходить на інший застосунок.
   *
   * Тут робимо звичайний fetch.
   * Основне періодичне автозбереження залишається
   * головним механізмом синхронізації.
   * =========================================================
   */

  useEffect(() => {
    if (
      blocked ||
      finished ||
      !currentTestId
    ) {
      return;
    }

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        void saveSession();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    blocked,
    finished,
    currentTestId,
    currentQuestion,
    savedAnswers,
  ]);

  return null;
}