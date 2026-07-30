"use client";

import { Question } from "@/app/types/question";
import OptionsEditor from "./OptionsEditor";

type Props = {
  question: Question;
  onChange: (question: Question) => void;
};

export default function MultipleChoice({
  question,
  onChange,
}: Props) {

  function toggleCorrect(index: number) {

    const options = [...question.options];

    options[index] = {
      ...options[index],
      isCorrect: !options[index].isCorrect,
    };

    const correctAnswers = options
      .map((option, i) =>
        option.isCorrect ? i + 1 : null
      )
      .filter(
        (value): value is number =>
          value !== null
      );

    onChange({
      ...question,
      options,
      correctAnswers,
    });

  }

  return (

    <OptionsEditor
      question={question}
      onChange={onChange}
    >

      <div className="space-y-3">

        <h4 className="font-semibold text-lg">
          Правильні відповіді
        </h4>

        {question.options.map((option, index) => (

          <label
            key={option.id}
            className="flex items-center gap-3 cursor-pointer"
          >

            <input
              type="checkbox"
              checked={option.isCorrect}
              onChange={() =>
                toggleCorrect(index)
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