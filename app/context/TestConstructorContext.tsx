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

// Новий тест НЕ має id
const initialTest: Test = {
  title: "",
    examType: "НМТ",
  subject: "Українська мова",

  description: "",


  duration: 180,

  schoolYear: "2026",

  maxPoints: 45,

  isPublished: false,

  codeRequired: true,

  accessCode: "",

  questions: [createQuestion(1)],
};

const TestConstructorContext =
  createContext<TestConstructorContextType | null>(
    null
  );

export function TestConstructorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [test, setTestState] =
    useState<Test>(initialTest);

  function setTest(test: Test) {
    setTestState(test);
  }

  function updateTest<K extends keyof Test>(
    field: K,
    value: Test[K]
  ) {
    setTestState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function addQuestion() {
    setTestState((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        createQuestion(Date.now()),
      ],
    }));
  }

  function updateQuestion(question: Question) {
    setTestState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === question.id ? question : q
      ),
    }));
  }

  function deleteQuestion(id: number) {
    setTestState((prev) => ({
      ...prev,
      questions: prev.questions.filter(
        (q) => q.id !== id
      ),
    }));
  }

  function moveQuestionUp(id: number) {
    setTestState((prev) => {
      const questions = [...prev.questions];

      const index = questions.findIndex(
        (q) => q.id === id
      );

      if (index <= 0) {
        return prev;
      }

      [questions[index - 1], questions[index]] = [
        questions[index],
        questions[index - 1],
      ];

      return {
        ...prev,
        questions,
      };
    });
  }

  function moveQuestionDown(id: number) {
    setTestState((prev) => {
      const questions = [...prev.questions];

      const index = questions.findIndex(
        (q) => q.id === id
      );

      if (
        index === -1 ||
        index === questions.length - 1
      ) {
        return prev;
      }

      [questions[index], questions[index + 1]] = [
        questions[index + 1],
        questions[index],
      ];

      return {
        ...prev,
        questions,
      };
    });
  }

  function clearTest() {
    setTestState(initialTest);
  }

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