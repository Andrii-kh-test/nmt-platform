"use client";

import { useTestSession } from "@/app/context/TestSessionContext";

import QuestionCard from "./QuestionCard";

export default function QuestionList() {
  const {
    test,
    selectedAnswers,
    selectAnswer,
  } = useTestSession();

  if (!test) {
    return null;
  }

  return (
    <div className="space-y-6">

      {test.questions.map((question, index) => (

        <section
          key={question.id}
          id={`question-${question.id}`}
        >

          <QuestionCard
            question={question}
            number={index + 1}
            total={test.questions.length}
            selectedAnswers={
              selectedAnswers[question.id] ?? []
            }
            onAnswerChange={(answers) =>
              selectAnswer(question.id, answers)
            }
          />

        </section>

      ))}

    </div>
  );
}