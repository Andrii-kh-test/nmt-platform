"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import QuestionNumbers from "./QuestionNumbers";
import TestFinishedModal from "./TestFinishedModal";

import { useTestSession } from "@/app/context/TestSessionContext";

import { finishTest } from "@/app/services/testEngine";

export default function Sidebar() {
  const router = useRouter();

  const {
    test,
    savedAnswers,
    timeLeft,
  } = useTestSession();

  const [finishOpen, setFinishOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  if (!test) {
    return null;
  }

  function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    return `${String(min).padStart(2, "0")}:${String(
      sec
    ).padStart(2, "0")}`;
  }

  async function handleFinishTest() {
    try {
      setLoading(true);

      await finishTest(
        "manual",
        test,
        savedAnswers,
        timeLeft,
        router
      );
    } catch (error) {
      console.error(error);

      alert(
        "Не вдалося зберегти результат."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <aside className="sticky top-6 bg-white border border-gray-200 rounded-xl shadow-md p-6 h-fit">

        <h2 className="text-2xl font-bold text-[#7A1F2B] mb-6">
          Таймер
        </h2>

        <div className="text-center text-4xl font-bold text-[#7A1F2B] mb-8">
          {formatTime(timeLeft)}
        </div>

        <h3 className="text-lg font-semibold mb-4">
          Номери питань
        </h3>

        <QuestionNumbers />

        <div className="mt-8 border-t border-gray-200 pt-6">

          <div className="flex items-center gap-3 mb-3">

            <div className="w-5 h-5 rounded bg-[#7A1F2B]" />

            <span className="text-sm">
              Відповідь збережена
            </span>

          </div>

          <div className="flex items-center gap-3">

            <div className="w-5 h-5 rounded border border-gray-300 bg-white" />

            <span className="text-sm">
              Відповідь не збережена
            </span>

          </div>

        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => setFinishOpen(true)}
          className="
            mt-8
            w-full
            bg-red-600
            hover:bg-red-700
            disabled:bg-gray-400
            text-white
            font-semibold
            py-3
            rounded-lg
            transition
          "
        >
          {loading
            ? "Збереження..."
            : "Завершити тест"}
        </button>

      </aside>

      <TestFinishedModal
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        onFinish={handleFinishTest}
      />
    </>
  );
}