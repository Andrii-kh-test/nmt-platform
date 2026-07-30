"use client";

import { Question } from "@/app/types/question";

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
          className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            checked={selectedAnswers.includes(option.id)}
            onChange={() => onChange([option.id])}
          />

          <span>{option.text}</span>
        </label>
      ))}
    </div>
  );
}