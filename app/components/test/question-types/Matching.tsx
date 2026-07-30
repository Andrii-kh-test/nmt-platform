"use client";

import type { Question } from "@/app/types/question";


type Props = {
  question: Question;
  selectedAnswers: number[];
  onChange: (answers: number[]) => void;
};


export default function Matching({
  question,
  selectedAnswers,
  onChange,
}: Props) {


  const options = question.options ?? [];



  function toggleOption(id: number) {

    let updatedAnswers: number[];


    if (
      selectedAnswers.includes(id)
    ) {

      updatedAnswers =
        selectedAnswers.filter(
          (answer) =>
            answer !== id
        );

    } else {

      updatedAnswers = [
        ...selectedAnswers,
        id,
      ];

    }


    onChange(updatedAnswers);

  }



  return (
    <div
      className="
        rounded-lg
        border
        border-blue-200
        bg-blue-50
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
        Завдання на встановлення відповідності
      </h3>


      <p
        className="
          mb-4
          text-gray-600
        "
      >
        Оберіть правильні відповідності.
      </p>



      <div className="space-y-2">

        {options.map((option) => (

          <label
            key={option.id}
            className="
              flex
              cursor-pointer
              items-center
              gap-3
              rounded-lg
              border
              bg-white
              p-3
            "
          >

            <input
              type="checkbox"

              checked={
                selectedAnswers.includes(
                  option.id
                )
              }

              onChange={() =>
                toggleOption(
                  option.id
                )
              }
            />


            <span>
              {option.text}
            </span>


          </label>

        ))}

      </div>


    </div>
  );
}