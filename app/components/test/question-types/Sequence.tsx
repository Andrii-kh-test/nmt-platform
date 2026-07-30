"use client";

import { Question } from "@/app/types/question";

type Props = {
  question: Question;
};

export default function Sequence({
  question,
}: Props) {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">

      <h3 className="text-lg font-semibold mb-3">
        Завдання на встановлення послідовності
      </h3>

      <p className="text-gray-600">
        Реалізація сортування буде додана окремим уроком.
      </p>

      <div className="mt-6 space-y-2">

        {question.options.map((option) => (

          <div
            key={option.id}
            className="rounded-lg bg-white border p-3"
          >
            {option.text}
          </div>

        ))}

      </div>

    </div>
  );
}