"use client";

import { Question } from "@/app/types/question";
import HtmlContent from "@/app/components/common/HtmlContent";

type Props = {
  question: Question;
  selectedAnswers: number[];
  onChange: (answers: number[]) => void;
};

export default function MultipleChoice({
  question,
  selectedAnswers,
  onChange,
}: Props) {
  function toggleAnswer(id: number) {
    if (selectedAnswers.includes(id)) {
      onChange(
        selectedAnswers.filter(
          (answer) => answer !== id
        )
      );
    } else {
      onChange([
        ...selectedAnswers,
        id,
      ]);
    }
  }

  return (
    <div className="space-y-3">
      {question.options.map((option) => (
        <label
          key={option.id}
          className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
        >
          <input
            type="checkbox"
            checked={selectedAnswers.includes(option.id)}
            onChange={() =>
              toggleAnswer(option.id)
            }
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