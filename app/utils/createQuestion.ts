import { Question } from "@/app/types/question";

export function createQuestion(
  id: number
): Question {
  return {
    id,

    order: id,

    type: "single",

    text: "",

    // Нове поле
    shuffleQuestion: true,

    options: [
      {
        id: 1,
        order: 1,
        text: "",
        isCorrect: true,
      },
      {
        id: 2,
        order: 2,
        text: "",
        isCorrect: false,
      },
      {
        id: 3,
        order: 3,
        text: "",
        isCorrect: false,
      },
      {
        id: 4,
        order: 4,
        text: "",
        isCorrect: false,
      },
    ],
    matchingPairs: [
      {
        id: 1,
        left: "",
        right: "",
      },
      {
        id: 2,
        left: "",
        right: "",
      },
      {
        id: 3,
        left: "",
        right: "",
      },
    ],

    sequenceItems: [
      {
        id: 1,
        text: "",
        order: 1,
      },
      {
        id: 2,
        text: "",
        order: 2,
      },
      {
        id: 3,
        text: "",
        order: 3,
      },
      {
        id: 4,
        text: "",
        order: 4,
      },
    ],

    textAnswer: "",

    points: 1,

    explanation: "",
  };
}