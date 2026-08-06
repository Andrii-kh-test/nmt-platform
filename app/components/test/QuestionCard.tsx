"use client";

import { Question } from "@/app/types/question";

import SingleChoice from "./question-types/SingleChoice";
import MultipleChoice from "./question-types/MultipleChoice";

import Matching from "./question-types/Matching";
import Sequence from "./question-types/Sequence";

import { useTestSession } from "@/app/context/TestSessionContext";
import HtmlContent from "@/app/components/common/HtmlContent";
type Props = {
  question: Question;
  number: number;
  total: number;

  selectedAnswers: number[];

  onAnswerChange: (
    answers: number[]
  ) => void;
};

export default function QuestionCard({
  question,
  number,
  total,
  selectedAnswers,
  onAnswerChange,
}: Props) {

  const {
    saveAnswer,
    isQuestionSaved,
  } = useTestSession();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-xl font-semibold text-[#7A1F2B]">
          Питання {number} із {total}
        </h2>

        {isQuestionSaved(question.id) ? (
          <span className="text-green-600 font-semibold">
            ✓ Відповідь збережено
          </span>
        ) : (
          <span className="text-gray-400">
            Не збережено
          </span>
        )}

      </div>

      <div className="mb-8">

        <HtmlContent
  html={question.text}
  className="text-lg leading-7"
/>

      </div>

      {question.type === "single" && (
        <SingleChoice
          question={question}
          selectedAnswers={selectedAnswers}
          onChange={onAnswerChange}
        />
      )}

      {question.type === "multiple" && (
        <MultipleChoice
          question={question}
          selectedAnswers={selectedAnswers}
          onChange={onAnswerChange}
        />
      )}

    

      {question.type === "matching" && (
        <Matching
          question={question}
          selectedAnswers={selectedAnswers}
          onChange={onAnswerChange}
        />
      )}

      {question.type === "sequence" && (
        <Sequence
          question={question}
          selectedAnswers={selectedAnswers}
          onChange={onAnswerChange}
        />
      )}
<hr className="my-8 border-gray-200" />
      <div className="mt-10 flex justify-end">

        <button
          type="button"
          onClick={() =>
            saveAnswer(question.id)
          }
          className="bg-[#7A1F2B] hover:bg-[#641823] text-white px-6 py-2.5 rounded-lg font-medium transition"
        >
          Зберегти відповідь
        </button>

      </div>

    </div>
  );
}