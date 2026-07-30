"use client";

import { Question } from "@/app/types/question";

import SingleChoice from "./question-types/SingleChoice";
import MultipleChoice from "./question-types/MultipleChoice";
import Matching from "./question-types/Matching";
import Sequence from "./question-types/Sequence";
import TextAnswer from "./question-types/TextAnswer";

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

            <option value="text">
              Коротка текстова відповідь
            </option>

          </select>

        </div>

        <div>

          <label className="block font-medium mb-2">
            Текст питання
          </label>

          <textarea
            rows={4}
            value={question.text}
            onChange={(e) =>
              updateField("text", e.target.value)
            }
            className="w-full border rounded-lg p-3"
          />

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
          <Sequence />
        )}

        {question.type === "text" && (
          <TextAnswer />
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