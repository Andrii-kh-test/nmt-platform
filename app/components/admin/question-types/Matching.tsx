"use client";

import { Question } from "@/app/types/question";

type Props = {
  question: Question;
  onChange: (question: Question) => void;
};

export default function Matching({
  question,
  onChange,
}: Props) {

  function updateQuestionText(
    value: string
  ) {
    onChange({
      ...question,
      text: value,
    });
  }

  function updateLeft(
    id: number,
    value: string
  ) {
    onChange({
      ...question,
      matchingLeftItems:
        question.matchingLeftItems.map((item) =>
          item.id === id
            ? {
                ...item,
                text: value,
              }
            : item
        ),
    });
  }

  function updateRight(
    id: number,
    value: string
  ) {
    onChange({
      ...question,
      matchingRightItems:
        question.matchingRightItems.map((item) =>
          item.id === id
            ? {
                ...item,
                text: value,
              }
            : item
        ),
    });
  }

  function updateCorrect(
    leftId: number,
    rightId: number
  ) {
    onChange({
      ...question,
      matchingLeftItems:
        question.matchingLeftItems.map((item) =>
          item.id === leftId
            ? {
                ...item,
                correctRightId: rightId,
              }
            : item
        ),
    });
  }

  const letters = [
    "А",
    "Б",
    "В",
    "Г",
    "Д",
  ];
    return (
    <div className="space-y-6">

      {/* Умова */}
      <div>
        <label className="mb-2 block font-semibold">
          Умова завдання
        </label>

        <textarea
          value={question.text}
          onChange={(e) =>
            updateQuestionText(e.target.value)
          }
          rows={4}
          className="
            w-full
            rounded-lg
            border
            p-3
          "
          placeholder="Введіть умову завдання..."
        />
      </div>

      <div className="grid grid-cols-2 gap-8">

        {/* Ліва колонка */}
        <div>

          <h3 className="mb-3 font-semibold">
            Ліва колонка
          </h3>

          <div className="space-y-3">

            {question.matchingLeftItems.map((item, index) => (

              <div
                key={item.id}
                className="flex items-center gap-3"
              >

                <div className="w-6 font-bold">
                  {index + 1}.
                </div>

                <input
                  value={item.text}
                  onChange={(e) =>
                    updateLeft(
                      item.id,
                      e.target.value
                    )
                  }
                  className="
                    flex-1
                    rounded
                    border
                    p-2
                  "
                />

                <select
                  value={item.correctRightId}
                  onChange={(e) =>
                    updateCorrect(
                      item.id,
                      Number(e.target.value)
                    )
                  }
                  className="
                    rounded
                    border
                    p-2
                  "
                >

                  {letters.map((letter, index) => (

                    <option
                      key={index}
                      value={index + 1}
                    >
                      {letter}
                    </option>

                  ))}

                </select>

              </div>

            ))}

          </div>

        </div>
                {/* Права колонка */}
        <div>

          <h3 className="mb-3 font-semibold">
            Права колонка
          </h3>

          <div className="space-y-3">

            {question.matchingRightItems.map((item, index) => (

              <div
                key={item.id}
                className="flex items-center gap-3"
              >

                <div className="w-6 font-bold">
                  {letters[index]}.
                </div>

                <input
                  value={item.text}
                  onChange={(e) =>
                    updateRight(
                      item.id,
                      e.target.value
                    )
                  }
                  className="
                    flex-1
                    rounded
                    border
                    p-2
                  "
                />

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}