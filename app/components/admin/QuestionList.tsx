"use client";

import QuestionItem from "./QuestionItem";

import { useTestConstructor } from "@/app/context/TestConstructorContext";

export default function QuestionList() {
  const {
    test,
    addQuestion,
    deleteQuestion,
    updateQuestion,
  } = useTestConstructor();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">

      <div className="flex justify-between items-center mb-8">

        <h2 className="text-2xl font-bold text-[#7A1F2B]">
          Питання тесту
        </h2>

        <button
          type="button"
          onClick={addQuestion}
          className="bg-[#7A1F2B] hover:bg-[#651923] text-white px-5 py-3 rounded-lg transition"
        >
          + Додати питання
        </button>

      </div>

      {test.questions.length === 0 ? (

        <div className="text-center py-12 border-2 border-dashed rounded-xl text-gray-500">

          У тесті ще немає питань

        </div>

      ) : (

        <div className="space-y-6">

          {test.questions.map((question, index) => (

            <QuestionItem
              key={question.id}
              number={index + 1}
              question={question}
              onDelete={() => deleteQuestion(question.id)}
              onChange={updateQuestion}
            />

          ))}

        </div>

      )}

    </div>
  );
}