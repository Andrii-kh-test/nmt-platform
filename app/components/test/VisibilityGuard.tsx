"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTestSession } from "@/app/context/TestSessionContext";
import { finishTest } from "@/app/services/testEngine";

export default function VisibilityGuard() {
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

      const nextViolations = violations + 1;

      setViolations(nextViolations);

      if (nextViolations === 1) {
        setShowWarning(true);
        return;
      }

      if (!test) return;

      await finishTest(
        "security",
        test,
        savedAnswers,
        timeLeft,
        router
      );
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
  ]);

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8">

        <h2 className="text-3xl font-bold text-red-700 mb-6">
          Попередження
        </h2>

        <p className="text-lg leading-8 mb-8">
          Ви залишили сторінку тестування або перейшли на іншу вкладку.

          <br /><br />

          Це є порушенням правил проходження тестування.

          <br /><br />

          Наступне таке порушення автоматично завершить тест.
        </p>

        <button
          onClick={() => setShowWarning(false)}
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