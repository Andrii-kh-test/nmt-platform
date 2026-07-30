"use client";

import { useTestSession } from "@/app/context/TestSessionContext";

export default function QuestionNavigator() {
  const {
    test,
    currentQuestion,
    setCurrentQuestion,
  } = useTestSession();

  if (!test) {
    return null;
  }

  const isFirstQuestion =
    currentQuestion === 0;

  const isLastQuestion =
    currentQuestion ===
    test.questions.length - 1;

  function previousQuestion() {
    if (!isFirstQuestion) {
      setCurrentQuestion(
        currentQuestion - 1
      );
    }
  }

  function nextQuestion() {
    if (!isLastQuestion) {
      setCurrentQuestion(
        currentQuestion + 1
      );
    }
  }

  return (
    <div className="mt-8 flex justify-between items-center">

      <button
        type="button"
        onClick={previousQuestion}
        disabled={isFirstQuestion}
        className={`
          px-6 py-3 rounded-lg font-medium transition

          ${
            isFirstQuestion
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-100 hover:bg-gray-200"
          }
        `}
      >
        ← Попереднє
      </button>

      <button
        type="button"
        className="px-8 py-3 rounded-lg bg-[#7A1F2B] text-white hover:bg-[#651923] transition"
      >
        Зберегти відповідь
      </button>

      <button
        type="button"
        onClick={nextQuestion}
        disabled={isLastQuestion}
        className={`
          px-6 py-3 rounded-lg font-medium transition

          ${
            isLastQuestion
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#7A1F2B] text-white hover:bg-[#651923]"
          }
        `}
      >
        Наступне →
      </button>

    </div>
  );
}