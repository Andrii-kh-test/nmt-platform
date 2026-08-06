"use client";

import { Question } from "@/app/types/question";
import HtmlContent from "@/app/components/common/HtmlContent";

type Props = {
  question: Question;
  selectedAnswers: number[];
  onChange: (answers: number[]) => void;
};

export default function SingleChoice({
  question,
  selectedAnswers,
  onChange,
}: Props) {
  return (
    <div className="space-y-3">
      {question.options.map((option) => (
        <label
          key={option.id}
          className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            checked={selectedAnswers.includes(option.id)}
            onChange={() => onChange([option.id])}
            className="mt-1"
          />

          <HtmlContent
            html={option.text}
            className="flex-1"
          />
        </label>
      ))}
    </div>
  );
}