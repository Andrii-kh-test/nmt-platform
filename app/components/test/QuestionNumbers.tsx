"use client";

import { useTestSession } from "@/app/context/TestSessionContext";

export default function QuestionNumbers() {
  const {
    test,
    savedAnswers,
  } = useTestSession();

  if (!test) {
    return null;
  }

  function scrollToQuestion(questionId: number) {
    const element = document.getElementById(
      `question-${questionId}`
    );

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="grid grid-cols-5 gap-3">

      {test.questions.map((question, index) => {

        const saved =
          savedAnswers[question.id] !== undefined;

        return (
          <button
            key={question.id}
            type="button"
            onClick={() =>
              scrollToQuestion(question.id)
            }
            className={`
              h-12
              rounded-lg
              font-semibold
              transition

              ${
                saved
                  ? "bg-[#7A1F2B] text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:border-[#7A1F2B]"
              }
            `}
          >
            {index + 1}
          </button>
        );

      })}
    </div>
  );
}