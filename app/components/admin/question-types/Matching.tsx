"use client";

import type { Question } from "@/app/types/question";


interface Props {
  question: Question;
  onChange: (question: Question) => void;
}


export default function Matching({
  question,
  onChange,
}: Props) {


  const options = question.options ?? [];



  function updateOption(
    id: number,
    value: string
  ) {

    onChange({

      ...question,

      options: options.map(
        (option) =>
          option.id === id
            ? {
                ...option,
                text: value,
              }
            : option
      ),

    });

  }



  return (

    <div
      className="
        rounded-lg
        border
        border-blue-200
        bg-blue-50
        p-4
      "
    >

      <h3
        className="
          mb-3
          font-semibold
          text-gray-700
        "
      >
        Редактор встановлення відповідностей
      </h3>


      <p
        className="
          mb-3
          text-sm
          text-gray-600
        "
      >
        Введіть варіанти відповідностей.
      </p>



      <div className="space-y-3">


        {options.map(
          (option) => (

            <div
              key={option.id}
              className="
                rounded-lg
                bg-white
                p-2
                border
              "
            >

              <input
                type="text"

                value={option.text}

                onChange={(event) =>
                  updateOption(
                    option.id,
                    event.target.value
                  )
                }

                className="
                  w-full
                  rounded
                  border
                  px-3
                  py-2
                "

                placeholder="Варіант відповіді"

              />

            </div>

          )
        )}


      </div>


    </div>

  );

}