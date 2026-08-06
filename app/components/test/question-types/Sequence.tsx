"use client";

import type { Question } from "@/app/types/question";
import HtmlContent from "@/app/components/common/HtmlContent";

type Props = {
  question: Question;
  selectedAnswers: number[];
  onChange: (answers: number[]) => void;
};

export default function Sequence({
  question,
  selectedAnswers,
  onChange,
}: Props) {
  const options = question.options ?? [];

  function moveItem(
    index: number,
    direction: number
  ) {
    const newIndex = index + direction;

    if (
      newIndex < 0 ||
      newIndex >= options.length
    ) {
      return;
    }

    const updated = [...currentOrder];

    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    onChange(updated);
  }

  const currentOrder =
    selectedAnswers.length > 0
      ? selectedAnswers
      : options.map((option) => option.id);

  return (
    <div
      className="
        rounded-lg
        border
        border-yellow-300
        bg-yellow-50
        p-6
      "
    >
      <h3
        className="
          mb-3
          text-lg
          font-semibold
        "
      >
        Завдання на встановлення послідовності
      </h3>

      <p
        className="
          mb-4
          text-gray-600
        "
      >
        Розташуйте елементи у правильному порядку.
      </p>

      <div className="space-y-2">
        {currentOrder.map((id, index) => {
          const option = options.find(
            (item) => item.id === id
          );

          if (!option) return null;

          return (
            <div
              key={id}
              className="
                flex
                items-start
                justify-between
                gap-4
                rounded-lg
                border
                bg-white
                p-3
              "
            >
              <div className="flex gap-3 flex-1">
                <span className="font-semibold mt-1">
                  {index + 1}.
                </span>

                <HtmlContent
                  html={option.text}
                  className="flex-1"
                />
              </div>

              <div
                className="
                  flex
                  flex-col
                  gap-2
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    moveItem(index, -1)
                  }
                  className="
                    rounded
                    bg-gray-200
                    px-3
                    py-1
                    hover:bg-gray-300
                  "
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() =>
                    moveItem(index, 1)
                  }
                  className="
                    rounded
                    bg-gray-200
                    px-3
                    py-1
                    hover:bg-gray-300
                  "
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}