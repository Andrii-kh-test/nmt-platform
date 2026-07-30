"use client";

import { Question } from "@/app/types/question";
import OptionsEditor from "./OptionsEditor";

type Props = {
  question: Question;
  onChange: (question: Question) => void;
};

export default function SingleChoice({
  question,
  onChange,
}: Props) {

  function selectCorrect(index: number) {

    const options = question.options.map((option, i) => ({
      ...option,
      isCorrect: i === index,
    }));

    onChange({
      ...question,
      options,
      correctAnswers: [index + 1],
    });

  }

  return (

    <OptionsEditor
      question={question}
      onChange={onChange}
    >

      <div className="space-y-3">

        <h4 className="font-semibold text-lg">
          Правильна відповідь
        </h4>

        {question.options.map((option, index) => (

          <label
            key={option.id}
            className="flex items-center gap-3 cursor-pointer"
          >

            <input
              type="radio"
              checked={option.isCorrect}
              onChange={() =>
                selectCorrect(index)
              }
            />

            <span>
              Варіант {index + 1}
            </span>

          </label>

        ))}

      </div>

    </OptionsEditor>

  );

}