"use client";

import {
  useEffect,
  useRef,
} from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

import QuestionCard from "./QuestionCard";

export default function QuestionView() {
  const {
    test,
    selectedAnswers,
    selectAnswer,
    setCurrentQuestion,
  } = useTestSession();

  const questionRefs =
    useRef<Array<HTMLDivElement | null>>([]);

  // =====================================================
  // ВИЗНАЧЕННЯ ПОТОЧНОГО ПИТАННЯ
  //
  // Тест іде однією стрічкою.
  //
  // Поточним вважаємо питання, центр якого
  // найближчий до центру видимої області екрана.
  // =====================================================

  useEffect(() => {
    if (!test) {
      return;
    }

    let frameId: number | null = null;

    function updateCurrentQuestion() {
      if (frameId !== null) {
        return;
      }

      frameId = requestAnimationFrame(() => {
        frameId = null;

        const elements =
          questionRefs.current.filter(
            (
              element
            ): element is HTMLDivElement =>
              element !== null
          );

        if (elements.length === 0) {
          return;
        }

        const viewportCenter =
          window.innerHeight / 2;

        let closestIndex = 0;
        let closestDistance = Infinity;

        elements.forEach(
          (element, index) => {
            const rect =
              element.getBoundingClientRect();

            // Питання повністю нижче екрана
            if (rect.top >= window.innerHeight) {
              return;
            }

            // Питання повністю вище екрана
            if (rect.bottom <= 0) {
              return;
            }

            const elementCenter =
              rect.top +
              rect.height / 2;

            const distance =
              Math.abs(
                elementCenter -
                  viewportCenter
              );

            if (
              distance <
              closestDistance
            ) {
              closestDistance =
                distance;

              closestIndex = index;
            }
          }
        );

        setCurrentQuestion(
          closestIndex
        );
      });
    }

    // Перша перевірка
    updateCurrentQuestion();

    window.addEventListener(
      "scroll",
      updateCurrentQuestion,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "resize",
      updateCurrentQuestion
    );

    return () => {
      window.removeEventListener(
        "scroll",
        updateCurrentQuestion
      );

      window.removeEventListener(
        "resize",
        updateCurrentQuestion
      );

      if (frameId !== null) {
        cancelAnimationFrame(
          frameId
        );
      }
    };
  }, [
    test,
    setCurrentQuestion,
  ]);

  // =====================================================
  // TEST ЩЕ НЕ ЗАВАНТАЖЕНИЙ
  // =====================================================

  if (!test) {
    return null;
  }

  return (
    <div className="space-y-6">
      {test.questions.map(
        (
          question,
          index
        ) => (
          <div
            key={question.id}
            id={`question-${question.id}`}
            data-question-index={index}
            ref={(element) => {
              questionRefs.current[
                index
              ] = element;
            }}
          >
            <QuestionCard
              question={question}
              number={index + 1}
              total={
                test.questions.length
              }
              selectedAnswers={
                selectedAnswers[
                  question.id
                ] ?? []
              }
              onAnswerChange={(
                answers
              ) =>
                selectAnswer(
                  question.id,
                  answers
                )
              }
            />
          </div>
        )
      )}
    </div>
  );
}