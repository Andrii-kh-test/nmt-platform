import { Question } from "@/app/types/question";

export function createQuestion(
  id: number
): Question {
  return {
    id,

    order: id,

    type: "single",

    text: "",

    // Чи дозволено перемішувати питання
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

    // Ліва колонка (1–4)
    matchingLeftItems: [
      {
        id: 1,
        text: "",
        correctRightId: 1,
      },
      {
        id: 2,
        text: "",
        correctRightId: 2,
      },
      {
        id: 3,
        text: "",
        correctRightId: 3,
      },
      {
        id: 4,
        text: "",
        correctRightId: 4,
      },
    ],

    // Права колонка (А–Д)
    matchingRightItems: [
      {
        id: 1,
        text: "",
      },
      {
        id: 2,
        text: "",
      },
      {
        id: 3,
        text: "",
      },
      {
        id: 4,
        text: "",
      },
      {
        id: 5,
        text: "",
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