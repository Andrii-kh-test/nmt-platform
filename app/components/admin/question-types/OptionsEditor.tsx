"use client";

import { Question } from "@/app/types/question";

type Props = {
  question: Question;
  onChange: (question: Question) => void;
  children?: React.ReactNode;
};

export default function OptionsEditor({
  question,
  onChange,
  children,
}: Props) {
  function updateOption(index: number, text: string) {
    const options = [...question.options];

    options[index] = {
      ...options[index],
      text,
    };

    onChange({
      ...question,
      options,
    });
  }

  function addOption() {
    onChange({
      ...question,
      options: [
        ...question.options,
        {
          id: Date.now(),
          order: question.options.length + 1,
          text: "",
          isCorrect: false,
        },
      ],
    });
  }

  function deleteOption(index: number) {
    if (question.options.length <= 2) {
      return;
    }

    const options = question.options
      .filter((_, i) => i !== index)
      .map((option, i) => ({
        ...option,
        order: i + 1,
      }));

    onChange({
      ...question,
      options,
    });
  }

  return (
    <div className="space-y-6">
      {question.options.map((option, index) => (
        <div
          key={option.id}
          className="flex gap-3 items-center"
        >
          <input
            type="text"
            value={option.text}
            onChange={(e) =>
              updateOption(index, e.target.value)
            }
            placeholder={`Варіант ${index + 1}`}
            className="flex-1 border rounded-lg p-3"
          />

          <button
            type="button"
            onClick={() => deleteOption(index)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addOption}
        className="bg-[#7A1F2B] hover:bg-[#651923] text-white px-5 py-2 rounded-lg"
      >
        + Додати варіант
      </button>

      {children}
    </div>
  );
}