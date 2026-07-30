"use client";

import { Question } from "@/app/types/question";

type Props = {
  question: Question;
};

export default function Matching({
  question,
}: Props) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">

      <h3 className="text-lg font-semibold mb-3">
        Завдання на встановлення відповідності
      </h3>

      <p className="text-gray-600">
        Цей тип завдань буде реалізовано на наступному етапі.
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