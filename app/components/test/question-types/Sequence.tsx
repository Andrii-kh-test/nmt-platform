"use client";

import type { Question } from "@/app/types/question";


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


    const updated = [...selectedAnswers];


    const temp = updated[index];

    updated[index] = updated[newIndex];

    updated[newIndex] = temp;


    onChange(updated);

  }



  const currentOrder =
    selectedAnswers.length > 0
      ? selectedAnswers
      : options.map(
          (option) => option.id
        );



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


        {currentOrder.map(
          (id, index) => {

            const option =
              options.find(
                (item) =>
                  item.id === id
              );


            if (!option) return null;


            return (

              <div
                key={id}
                className="
                  flex
                  items-center
                  justify-between
                  rounded-lg
                  border
                  bg-white
                  p-3
                "
              >

                <span>
                  {index + 1}. {option.text}
                </span>


                <div
                  className="
                    flex
                    gap-2
                  "
                >

                  <button
                    type="button"
                    onClick={() =>
                      moveItem(
                        index,
                        -1
                      )
                    }
                    className="
                      rounded
                      bg-gray-200
                      px-2
                    "
                  >
                    ↑
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      moveItem(
                        index,
                        1
                      )
                    }
                    className="
                      rounded
                      bg-gray-200
                      px-2
                    "
                  >
                    ↓
                  </button>

                </div>


              </div>

            );

          }
        )}


      </div>


    </div>

  );
}