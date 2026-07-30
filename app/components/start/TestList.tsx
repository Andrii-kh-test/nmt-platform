"use client";

import TestCard from "@/app/components/start/TestCard";
import { Test } from "@/app/types/test";


type Props = {
  tests: (Test & {
    id: number;
    questions: {
      id: number;
    }[];
  })[];
};


export default function TestList({
  tests,
}: Props) {


  if (tests.length === 0) {

    return (

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">

        <h2 className="text-2xl font-semibold text-gray-700">
          Доступних тестів поки що немає
        </h2>

        <p className="mt-4 text-gray-500">
          Створіть тест в адміністративній панелі.
        </p>

      </div>

    );

  }


  return (

    <div className="
      grid
      grid-cols-1
      md:grid-cols-2
      xl:grid-cols-3
      gap-8
    ">

      {tests.map((test) => (

        <TestCard

          key={test.id}

          id={test.id}

          title={test.title}

          subject={test.subject}

          duration={test.duration}

          questions={
            test.questions.length
          }

        />

      ))}


    </div>

  );

}