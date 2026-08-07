"use client";

import { Question } from "@/app/types/question";

import SingleChoice from "./question-types/SingleChoice";
import MultipleChoice from "./question-types/MultipleChoice";
import Matching from "./question-types/Matching";
import Sequence from "./question-types/Sequence";

import RichTextEditor from "@/app/components/editor/RichTextEditor";

type Props = {
  question: Question;
  number: number;
  onDelete: () => void;
  onChange: (question: Question) => void;
};

export default function QuestionItem({
  question,
  number,
  onDelete,
  onChange,
}: Props) {
  function updateField<K extends keyof Question>(
    field: K,
    value: Question[K]
  ) {
    onChange({
      ...question,
      [field]: value,
    });
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm p-6">

      <div className="flex justify-between items-center mb-6">

        <h3 className="text-xl font-bold text-[#7A1F2B]">
          Питання №{number}
        </h3>

        <button
          type="button"
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
        >
          Видалити
        </button>

      </div>

      <div className="space-y-6">

        <div>

          <label className="block font-medium mb-2">
            Тип завдання
          </label>

          <select
            value={question.type}
            onChange={(e) =>
              updateField(
                "type",
                e.target.value as Question["type"]
              )
            }
            className="w-full border rounded-lg p-3"
          >
            <option value="single">
              Одна правильна відповідь
            </option>

            <option value="multiple">
              Кілька правильних відповідей
            </option>

            <option value="matching">
              Встановлення відповідності
            </option>

            <option value="sequence">
              Встановлення послідовності
            </option>

          </select>

        </div>

        <div>

          <label className="block font-medium mb-2">
            Текст питання
          </label>

          <RichTextEditor
            value={question.text}
            onChange={(html) =>
              updateField("text", html)
            }
          />

        </div>

        <div className="bg-slate-50 border rounded-lg p-4">

          <label className="flex items-center gap-3 cursor-pointer">

            <input
              type="checkbox"
              checked={question.shuffleQuestion}
              onChange={(e) =>
                updateField(
                  "shuffleQuestion",
                  e.target.checked
                )
              }
              className="w-5 h-5"
            />

            <span className="font-medium">
              Перемішувати це питання
            </span>

          </label>

          <p className="text-sm text-gray-500 mt-2 ml-8">
            Якщо вимкнути, питання завжди залишатиметься
            на своєму місці під час проходження тесту.
          </p>

        </div>

        {question.type === "single" && (
          <SingleChoice
            question={question}
            onChange={onChange}
          />
        )}

        {question.type === "multiple" && (
          <MultipleChoice
            question={question}
            onChange={onChange}
          />
        )}

        {question.type === "matching" && (
          <Matching
            question={question}
            onChange={onChange}
          />
        )}

        {question.type === "sequence" && (
          <Sequence
            question={question}
            onChange={onChange}
          />
        )}

        <div>

          <label className="block font-medium mb-2">
            Кількість балів
          </label>

          <input
            type="number"
            min={1}
            value={question.points}
            onChange={(e) =>
              updateField(
                "points",
                Number(e.target.value)
              )
            }
            className="w-40 border rounded-lg p-3"
          />

        </div>

      </div>

    </div>
  );
}