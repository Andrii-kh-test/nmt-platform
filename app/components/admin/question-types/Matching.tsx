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
  // ==============================
  // Літери правих варіантів
  // ==============================

  const letters = [
    "А",
    "Б",
    "В",
    "Г",
    "Д",
  ];

  // ==============================
  // Умова завдання
  // ==============================

  function updateQuestionText(value: string) {
    onChange({
      ...question,
      text: value,
    });
  }

  // ==============================
  // Ліва частина
  // ==============================

  function updateLeft(
    id: number,
    value: string
  ) {
    onChange({
      ...question,

      matchingLeftItems:
        question.matchingLeftItems.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  text: value,
                }
              : item
        ),
    });
  }

  // ==============================
  // Права частина
  // ==============================

  function updateRight(
    id: number,
    value: string
  ) {
    onChange({
      ...question,

      matchingRightItems:
        question.matchingRightItems.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  text: value,
                }
              : item
        ),
    });
  }

  // ==============================
  // Правильна відповідність
  // ==============================

  function updateCorrect(
    leftId: number,
    rightId: number
  ) {
    onChange({
      ...question,

      matchingLeftItems:
        question.matchingLeftItems.map(
          (item) =>
            item.id === leftId
              ? {
                  ...item,
                  correctRightId:
                    rightId,
                }
              : item
        ),
    });
  }

  return (
    <div className="space-y-8">
      {/* ========================= */}
      {/* Умова */}
      {/* ========================= */}

      <div>
        <label className="mb-2 block font-semibold">
          Умова завдання
        </label>

        <textarea
          value={question.text}
          onChange={(e) =>
            updateQuestionText(
              e.target.value
            )
          }
          rows={4}
          className="
            w-full
            rounded-lg
            border
            border-gray-300
            p-3
            outline-none
            focus:border-[#7A1F2B]
          "
          placeholder="Введіть умову завдання..."
        />
      </div>

      {/* ========================= */}
      {/* Дві колонки */}
      {/* ========================= */}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ======================= */}
        {/* Ліва колонка */}
        {/* ======================= */}

        <div>
          <h3 className="mb-3 font-semibold">
            Ліва колонка
          </h3>

          <div className="space-y-3">
            {question.matchingLeftItems.map(
              (item, index) => (
                <div
                  key={item.id}
                  className="
                    rounded-lg
                    border
                    border-gray-200
                    bg-gray-50
                    p-3
                  "
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="w-6 shrink-0 font-bold">
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
                        min-w-0
                        flex-1
                        rounded
                        border
                        border-gray-300
                        bg-white
                        p-2
                        outline-none
                        focus:border-[#7A1F2B]
                      "
                      placeholder={`Лівий елемент ${
                        index + 1
                      }`}
                    />
                  </div>

                  {/* Правильна відповідність */}

                  <div className="ml-9">
                    <label className="mb-1 block text-sm font-medium text-gray-600">
                      Правильна відповідь
                    </label>

                    <select
                      value={
                        item.correctRightId ??
                        ""
                      }
                      onChange={(e) => {
                        const value =
                          Number(
                            e.target.value
                          );

                        if (!value) {
                          return;
                        }

                        updateCorrect(
                          item.id,
                          value
                        );
                      }}
                      className="
                        w-full
                        rounded
                        border
                        border-gray-300
                        bg-white
                        p-2
                        outline-none
                        focus:border-[#7A1F2B]
                      "
                    >
                      <option value="">
                        Оберіть правильний
                        варіант
                      </option>

                      {question.matchingRightItems.map(
                        (
                          rightItem,
                          rightIndex
                        ) => (
                          <option
                            key={
                              rightItem.id
                            }
                            value={
                              rightItem.id
                            }
                          >
                            {letters[
                              rightIndex
                            ] ?? ""}{" "}
                            —{" "}
                            {rightItem.text ||
                              `Варіант ${
                                rightIndex +
                                1
                              }`}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ======================= */}
        {/* Права колонка */}
        {/* ======================= */}

        <div>
          <h3 className="mb-3 font-semibold">
            Права колонка
          </h3>

          <div className="space-y-3">
            {question.matchingRightItems.map(
              (item, index) => (
                <div
                  key={item.id}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-lg
                    border
                    border-gray-200
                    bg-gray-50
                    p-3
                  "
                >
                  <div className="w-6 shrink-0 font-bold">
                    {letters[index] ??
                      String.fromCharCode(
                        1040 + index
                      )}
                    .
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
                      min-w-0
                      flex-1
                      rounded
                      border
                      border-gray-300
                      bg-white
                      p-2
                      outline-none
                      focus:border-[#7A1F2B]
                    "
                    placeholder={`Правий варіант ${
                      letters[index] ??
                      index + 1
                    }`}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}