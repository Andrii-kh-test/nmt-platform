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

  function updateLeft(
    index: number,
    value: string
  ) {
    const pairs = [...question.matchingPairs];

    pairs[index] = {
      ...pairs[index],
      left: value,
    };

    onChange({
      ...question,
      matchingPairs: pairs,
    });
  }

  function updateRight(
    index: number,
    value: string
  ) {
    const pairs = [...question.matchingPairs];

    pairs[index] = {
      ...pairs[index],
      right: value,
    };

    onChange({
      ...question,
      matchingPairs: pairs,
    });
  }

  function addPair() {

    onChange({
      ...question,
      matchingPairs: [
        ...question.matchingPairs,
        {
          id: Date.now(),
          left: "",
          right: "",
        },
      ],
    });

  }

  function deletePair(index: number) {

    if (question.matchingPairs.length <= 2) {
      return;
    }

    const pairs =
      question.matchingPairs.filter(
        (_, i) => i !== index
      );

    onChange({
      ...question,
      matchingPairs: pairs,
    });

  }

  return (

    <div className="space-y-5">

      <h4 className="text-lg font-semibold">

        Пари для встановлення відповідності

      </h4>

      {question.matchingPairs.map(
        (pair, index) => (

          <div
            key={pair.id}
            className="grid grid-cols-12 gap-3 items-center"
          >

            <div className="col-span-5">

              <input
                type="text"
                value={pair.left}
                placeholder={`Ліва частина ${index + 1}`}
                onChange={(e) =>
                  updateLeft(
                    index,
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3"
              />

            </div>

            <div className="col-span-5">

              <input
                type="text"
                value={pair.right}
                placeholder={`Права частина ${index + 1}`}
                onChange={(e) =>
                  updateRight(
                    index,
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3"
              />

            </div>

            <div className="col-span-2">

              <button
                type="button"
                onClick={() =>
                  deletePair(index)
                }
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-3"
              >
                ✕
              </button>

            </div>

          </div>

        )
      )}

      <button
        type="button"
        onClick={addPair}
        className="bg-[#7A1F2B] hover:bg-[#651923] text-white px-5 py-3 rounded-lg"
      >
        + Додати пару
      </button>

    </div>

  );

}