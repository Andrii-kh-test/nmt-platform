"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { Test } from "@/app/types/test";

export type UserAnswers = Record<number, number[]>;

type TestSessionContextType = {
  // ==========================
  // ID поточної сесії
  // ==========================

  sessionId: number | null;

  setSessionId: (id: number | null) => void;

  // ==========================
  // Завантажений тест
  // ==========================

  test: Test | null;

  loadTest: (test: Test) => void;

  // ==========================
  // Поточне питання
  // ==========================

  currentQuestion: number;

  setCurrentQuestion: (index: number) => void;

  // ==========================
  // Поточний вибір
  // ==========================

  selectedAnswers: UserAnswers;

  selectAnswer: (
    questionId: number,
    answers: number[]
  ) => void;

  // ==========================
  // Збережені відповіді
  // ==========================

  savedAnswers: UserAnswers;

  saveAnswer: (questionId: number) => void;

  isQuestionSaved: (questionId: number) => boolean;

  // ==========================
  // Відновлення сесії
  // ==========================

  restoreSession: (
    currentQuestion: number,
    savedAnswers: UserAnswers,
    timeLeft: number
  ) => void;

  // ==========================
  // Таймер
  // ==========================

  timeLeft: number;

  setTimeLeft: (seconds: number) => void;

  timerRunning: boolean;

  startTimer: () => void;

  stopTimer: () => void;

  // ==========================
  // Автоматичне завершення
  // ==========================

  onTimeExpired: (() => void) | null;

  setOnTimeExpired: (
    callback: (() => void) | null
  ) => void;

  // ==========================
  // Скидання тесту
  // ==========================

  resetTest: () => void;
};

const TestSessionContext =
  createContext<TestSessionContextType | null>(null);

export function TestSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sessionId, setSessionId] =
    useState<number | null>(null);

  const [test, setTest] =
    useState<Test | null>(null);

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0);

  // ==========================
  // Поточний вибір
  // ==========================

  const [
    selectedAnswers,
    setSelectedAnswers,
  ] = useState<UserAnswers>({});

  // ==========================
  // Збережені відповіді
  // ==========================

  const [
    savedAnswers,
    setSavedAnswers,
  ] = useState<UserAnswers>({});

  // ==========================
  // Таймер
  // ==========================

  const [
    timeLeft,
    setTimeLeft,
  ] = useState(0);

  const [
    timerRunning,
    setTimerRunning,
  ] = useState(false);

  // ==========================
  // Callback після завершення часу
  // ==========================

  const [
    onTimeExpired,
    setOnTimeExpired,
  ] = useState<(() => void) | null>(null);

  // ==========================
  // Завантаження тесту
  // ==========================

  function loadTest(loadedTest: Test) {
    setTest((prevTest) => {
      // Якщо цей тест уже завантажений —
      // не перезавантажуємо його
      if (
        prevTest &&
        prevTest.id === loadedTest.id
      ) {
        return prevTest;
      }

      return loadedTest;
    });

    // Якщо цей тест уже існує —
    // не очищаємо відповіді та таймер
    if (
      test &&
      test.id === loadedTest.id
    ) {
      return;
    }

    setCurrentQuestion(0);

    setSelectedAnswers({});

    setSavedAnswers({});

    setTimeLeft(
      loadedTest.duration * 60
    );

    setTimerRunning(false);
  }

  // ==========================
  // Обрати відповідь
  // ==========================

  function selectAnswer(
    questionId: number,
    answers: number[]
  ) {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answers,
    }));
  }

  // ==========================
  // Зберегти відповідь
  // ==========================

  function saveAnswer(
    questionId: number
  ) {
    const selected =
      selectedAnswers[questionId] ?? [];

    setSavedAnswers((prev) => ({
      ...prev,
      [questionId]: selected,
    }));
  }

  function isQuestionSaved(
    questionId: number
  ) {
    return (
      savedAnswers[questionId] !== undefined
    );
  }

  // ==========================
  // Таймер
  // ==========================

  function startTimer() {
    setTimerRunning(true);
  }

  function stopTimer() {
    setTimerRunning(false);
  }

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    if (timeLeft <= 0) {
      setTimerRunning(false);

      if (onTimeExpired) {
        onTimeExpired();
      }

      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          setTimerRunning(false);

          if (onTimeExpired) {
            onTimeExpired();
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [
    timerRunning,
    timeLeft,
    onTimeExpired,
  ]);

  // ==========================
  // Відновлення сесії
  // ==========================

  function restoreSession(
    question: number,
    answers: UserAnswers,
    seconds: number
  ) {
    setCurrentQuestion(question);

    setSelectedAnswers(answers);

    setSavedAnswers(answers);

    setTimeLeft(seconds);

    setTimerRunning(true);
  }

  // ==========================
  // Скидання тесту
  // ==========================

  function resetTest() {
  setSessionId(null);

  setTest(null);

  setCurrentQuestion(0);

  setSelectedAnswers({});

  setSavedAnswers({});

  setTimeLeft(0);

  setTimerRunning(false);

  setOnTimeExpired(null);
}

  return (
  <TestSessionContext.Provider
    value={{
      sessionId,

      setSessionId,

      test,

      loadTest,

      currentQuestion,

      setCurrentQuestion,

        selectedAnswers,

        selectAnswer,

        savedAnswers,

        saveAnswer,

        isQuestionSaved,

        restoreSession,

        timeLeft,

        setTimeLeft,

        timerRunning,

        startTimer,

        stopTimer,

        onTimeExpired,

        setOnTimeExpired,

        resetTest,
      }}
    >
      {children}
    </TestSessionContext.Provider>
  );
}

export function useTestSession() {
  const context =
    useContext(TestSessionContext);

  if (!context) {
    throw new Error(
      "useTestSession має використовуватися всередині TestSessionProvider"
    );
  }

  return context;
}