"use client";

import { useState } from "react";
import type { Question } from "@/app/types/question";


interface SequenceItem {
  id: number;
  text: string;
  order: number;
  isCorrect: boolean;
}


interface SequenceProps {
  question: Question;
  onChange: (question: Question) => void;
}


export default function Sequence({
  question,
  onChange,
}: SequenceProps) {


  const [items, setItems] = useState<SequenceItem[]>(
    question.options?.length
      ? question.options.map((item) => ({
          id: item.id,
          text: item.text,
          order: item.order,
          isCorrect: item.isCorrect,
        }))
      : [
          {
            id: 1,
            text: "",
            order: 1,
            isCorrect: true,
          },
          {
            id: 2,
            text: "",
            order: 2,
            isCorrect: true,
          },
          {
            id: 3,
            text: "",
            order: 3,
            isCorrect: true,
          },
        ]
  );



  function updateItems(
    newItems: SequenceItem[]
  ) {

    const reordered = newItems.map(
      (item, index) => ({
        ...item,
        order: index + 1,
      })
    );


    setItems(reordered);


    onChange({
      ...question,
      options: reordered,
    });

  }



  function changeText(
    id: number,
    value: string
  ) {

    updateItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              text: value,
            }
          : item
      )
    );

  }




  function addItem() {

    const newItem: SequenceItem = {
      id:
        items.length > 0
          ? Math.max(
              ...items.map(
                (item) => item.id
              )
            ) + 1
          : 1,

      text: "",

      order: items.length + 1,

      isCorrect: true,
    };


    updateItems([
      ...items,
      newItem,
    ]);

  }




  function removeItem(
    id: number
  ) {

    updateItems(
      items.filter(
        (item) =>
          item.id !== id
      )
    );

  }




  function moveItem(
    index: number,
    direction: number
  ) {

    const newIndex =
      index + direction;


    if (
      newIndex < 0 ||
      newIndex >= items.length
    ) {
      return;
    }


    const copy = [...items];


    const temp = copy[index];

    copy[index] = copy[newIndex];

    copy[newIndex] = temp;


    updateItems(copy);

  }




  return (

    <div
      className="
        rounded-lg
        border
        border-yellow-300
        bg-yellow-50
        p-4
      "
    >

      <h3
        className="
          mb-3
          font-semibold
        "
      >
        Встановлення послідовності
      </h3>


      <p
        className="
          mb-4
          text-sm
          text-gray-600
        "
      >
        Вкажіть елементи у правильному порядку.
      </p>



      <div className="space-y-3">


        {items.map(
          (item, index) => (

            <div
              key={item.id}
              className="
                flex
                items-center
                gap-2
                rounded-lg
                border
                bg-white
                p-2
              "
            >


              <span
                className="
                  w-8
                  font-bold
                  text-center
                "
              >
                {index + 1}
              </span>



              <input
                type="text"

                value={item.text}

                onChange={(e) =>
                  changeText(
                    item.id,
                    e.target.value
                  )
                }

                placeholder="Елемент"

                className="
                  flex-1
                  rounded
                  border
                  px-3
                  py-2
                "
              />



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



              <button
                type="button"

                onClick={() =>
                  removeItem(
                    item.id
                  )
                }

                className="
                  rounded
                  bg-red-100
                  px-2
                  text-red-600
                "
              >
                ×
              </button>


            </div>

          )
        )}


      </div>



      <button
        type="button"

        onClick={addItem}

        className="
          mt-4
          rounded-lg
          bg-green-600
          px-4
          py-2
          text-white
        "
      >
        + Додати елемент
      </button>


    </div>

  );
}