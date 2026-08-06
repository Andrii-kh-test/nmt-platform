"use client";

import { Question } from "@/app/types/question";
import RichTextEditor from "@/app/components/admin/RichTextEditor";

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
          className="border rounded-xl p-4 bg-slate-50 space-y-3"
        >
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[#7A1F2B]">
              Варіант {index + 1}
            </span>

            <button
              type="button"
              onClick={() => deleteOption(index)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
            >
              ✕
            </button>
          </div>

          <RichTextEditor
            value={option.text}
            onChange={(html) =>
              updateOption(index, html)
            }
          />
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