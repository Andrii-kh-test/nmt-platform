"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

import { Test } from "@/app/types/test";
import { Question } from "@/app/types/question";
import { createQuestion } from "@/app/utils/createQuestion";

type TestConstructorContextType = {
  test: Test;

  updateTest: <K extends keyof Test>(
    field: K,
    value: Test[K]
  ) => void;

  setTest: (test: Test) => void;

  addQuestion: () => void;

  updateQuestion: (question: Question) => void;

  deleteQuestion: (id: number) => void;

  moveQuestionUp: (id: number) => void;

  moveQuestionDown: (id: number) => void;

  clearTest: () => void;
};

// ========================================
// Створення початкового тесту
// ========================================

function createInitialTest(): Test {
  return {
    title: "",

    examType: "НМТ",

    subject: "Українська мова",

    description: "",

    duration: 180,

    schoolYear: "2026",

    maxPoints: 45,

    // Номер на головній сторінці.
    // 0 означає, що адміністратор
    // ще не вказав номер.
    displayOrder: 0,

    isPublished: false,

    codeRequired: true,

    accessCode: "",

    questions: [
      createQuestion(1),
    ],
  };
}

// ========================================
// CONTEXT
// ========================================

const TestConstructorContext =
  createContext<TestConstructorContextType | null>(
    null
  );

// ========================================
// PROVIDER
// ========================================

export function TestConstructorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [test, setTestState] =
    useState<Test>(
      createInitialTest()
    );

  // ========================================
  // SET TEST
  // ========================================

  function setTest(test: Test) {
    setTestState(test);
  }

  // ========================================
  // UPDATE TEST
  // ========================================

  function updateTest<K extends keyof Test>(
    field: K,
    value: Test[K]
  ) {
    setTestState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // ========================================
  // ADD QUESTION
  // ========================================

  function addQuestion() {
    setTestState((prev) => ({
      ...prev,

      questions: [
        ...prev.questions,
        createQuestion(Date.now()),
      ],
    }));
  }

  // ========================================
  // UPDATE QUESTION
  // ========================================

  function updateQuestion(
    question: Question
  ) {
    setTestState((prev) => ({
      ...prev,

      questions:
        prev.questions.map((q) =>
          q.id === question.id
            ? question
            : q
        ),
    }));
  }

  // ========================================
  // DELETE QUESTION
  // ========================================

  function deleteQuestion(id: number) {
    setTestState((prev) => ({
      ...prev,

      questions:
        prev.questions.filter(
          (q) => q.id !== id
        ),
    }));
  }

  // ========================================
  // MOVE QUESTION UP
  // ========================================

  function moveQuestionUp(id: number) {
    setTestState((prev) => {
      const questions = [
        ...prev.questions,
      ];

      const index =
        questions.findIndex(
          (q) => q.id === id
        );

      if (index <= 0) {
        return prev;
      }

      [
        questions[index - 1],
        questions[index],
      ] = [
        questions[index],
        questions[index - 1],
      ];

      return {
        ...prev,
        questions,
      };
    });
  }

  // ========================================
  // MOVE QUESTION DOWN
  // ========================================

  function moveQuestionDown(id: number) {
    setTestState((prev) => {
      const questions = [
        ...prev.questions,
      ];

      const index =
        questions.findIndex(
          (q) => q.id === id
        );

      if (
        index === -1 ||
        index === questions.length - 1
      ) {
        return prev;
      }

      [
        questions[index],
        questions[index + 1],
      ] = [
        questions[index + 1],
        questions[index],
      ];

      return {
        ...prev,
        questions,
      };
    });
  }

  // ========================================
  // CLEAR TEST
  // ========================================

  function clearTest() {
    setTestState(
      createInitialTest()
    );
  }

  // ========================================
  // PROVIDER
  // ========================================

  return (
    <TestConstructorContext.Provider
      value={{
        test,

        updateTest,

        setTest,

        addQuestion,

        updateQuestion,

        deleteQuestion,

        moveQuestionUp,

        moveQuestionDown,

        clearTest,
      }}
    >
      {children}
    </TestConstructorContext.Provider>
  );
}

// ========================================
// HOOK
// ========================================

export function useTestConstructor() {
  const context = useContext(
    TestConstructorContext
  );

  if (!context) {
    throw new Error(
      "useTestConstructor має використовуватися всередині TestConstructorProvider"
    );
  }

  return context;
}