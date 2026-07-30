"use client";

import { Question } from "@/app/types/question";

type Props = {
  question: Question;
  selectedAnswers: number[];
  onChange: (answers: number[]) => void;
};

export default function TextAnswer({
  question,
  selectedAnswers,
  onChange,
}: Props) {
  return (
    <div>
      <label className="block font-semibold mb-3">
        Введіть відповідь
      </label>

      <input
        type="text"
        value={selectedAnswers[0] ?? ""}
        onChange={(e) =>
          onChange(
            e.target.value === ""
              ? []
              : [Number(e.target.value)]
          )
        }
        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7A1F2B]"
        placeholder="Ваша відповідь..."
      />
    </div>
  );
}