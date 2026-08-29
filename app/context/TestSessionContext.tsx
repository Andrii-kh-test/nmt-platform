"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Test } from "@/app/types/test";

export type UserAnswers =
  Record<number, number[]>;

type TestSessionContextType = {
  sessionId: number | null;

  setSessionId: (
    id: number | null
  ) => void;

  test: Test | null;

  loadTest: (
    test: Test
  ) => void;

  currentQuestion: number;

  setCurrentQuestion: (
    index: number
  ) => void;

  selectedAnswers: UserAnswers;

  selectAnswer: (
    questionId: number,
    answers: number[]
  ) => void;

  savedAnswers: UserAnswers;

  saveAnswer: (
    questionId: number
  ) => void;

  isQuestionSaved: (
    questionId: number
  ) => boolean;

  restoreSession: (
    currentQuestion: number,
    savedAnswers: UserAnswers,
    timeLeft: number,
    startedAt: string | null,
    finished: boolean,
    blocked: boolean
  ) => void;

  timeLeft: number;

  setTimeLeft: (
    seconds: number
  ) => void;

  timerRunning: boolean;

  startTimer: () => void;

  stopTimer: () => void;

  onTimeExpired:
    | (() => void)
    | null;

  setOnTimeExpired: (
    callback:
      | (() => void)
      | null
  ) => void;

  resetTest: () => void;
};

const TestSessionContext =
  createContext<TestSessionContextType | null>(
    null
  );

export function TestSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  // =====================================================
  // SESSION
  // =====================================================

  const [
    sessionId,
    setSessionIdState,
  ] = useState<number | null>(null);

  useEffect(() => {
    const sessionStorageId =
      sessionStorage.getItem(
        "testSessionId"
      );

    const localStorageId =
      localStorage.getItem(
        "testSessionId"
      );

    const stored =
      sessionStorageId ??
      localStorageId;

    if (!stored) {
      return;
    }

    const id = Number(stored);

    if (
      Number.isInteger(id) &&
      id > 0
    ) {
      setSessionIdState(id);
    }
  }, []);

  const setSessionId =
    useCallback(
      (id: number | null) => {
        setSessionIdState(id);

        if (id === null) {
          sessionStorage.removeItem(
            "testSessionId"
          );

          localStorage.removeItem(
            "testSessionId"
          );

          return;
        }

        sessionStorage.setItem(
          "testSessionId",
          String(id)
        );

        localStorage.setItem(
          "testSessionId",
          String(id)
        );
      },
      []
    );

  // =====================================================
  // TEST
  // =====================================================

  const [
    test,
    setTest,
  ] = useState<Test | null>(null);

  // =====================================================
  // QUESTIONS
  // =====================================================

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0);

  // =====================================================
  // ANSWERS
  // =====================================================

  const [
    selectedAnswers,
    setSelectedAnswers,
  ] = useState<UserAnswers>({});

  const [
    savedAnswers,
    setSavedAnswers,
  ] = useState<UserAnswers>({});

  // =====================================================
  // TIMER
  // =====================================================

  const [
    timeLeft,
    setTimeLeftState,
  ] = useState(0);

  const [
    timerRunning,
    setTimerRunning,
  ] = useState(false);

  const deadlineRef =
    useRef<number | null>(null);

  const timerIntervalRef =
    useRef<number | null>(null);

  // =====================================================
  // EXPIRATION CALLBACK
  // =====================================================

  const [
    onTimeExpired,
    setOnTimeExpiredState,
  ] = useState<
    (() => void) | null
  >(null);

  const setOnTimeExpired =
    useCallback(
      (
        callback:
          | (() => void)
          | null
      ) => {
        setOnTimeExpiredState(
          () => callback
        );
      },
      []
    );

  // =====================================================
  // LOAD TEST
  //
  // ВАЖЛИВО:
  //
  // Завантаження тесту НЕ повинно
  // перезаписувати активну сесію.
  //
  // Якщо серверна сесія вже відновлена,
  // її timeLeft має пріоритет.
  // =====================================================

  const loadTest =
    useCallback(
      (loadedTest: Test) => {
        setTest(
          (previousTest) => {
            if (
              previousTest &&
              previousTest.id ===
                loadedTest.id
            ) {
              return previousTest;
            }

            setCurrentQuestion(0);

            setSelectedAnswers({});

            setSavedAnswers({});

            /*
             * Початковий час використовується
             * тільки як початкове значення UI.
             *
             * Реальний час активної сесії
             * встановлює restoreSession().
             */

            const initialTime =
              Math.max(
                0,
                Math.floor(
                  Number(
                    loadedTest.duration
                  ) * 60
                )
              );

            /*
             * Не запускаємо таймер.
             */

            setTimeLeftState(
              initialTime
            );

            setTimerRunning(false);

            deadlineRef.current =
              null;

            if (
              timerIntervalRef.current !==
              null
            ) {
              window.clearInterval(
                timerIntervalRef.current
              );

              timerIntervalRef.current =
                null;
            }

            return loadedTest;
          }
        );
      },
      []
    );

  // =====================================================
  // SET TIME LEFT
  // =====================================================

  const setTimeLeft =
    useCallback(
      (seconds: number) => {
        const normalized =
          Math.max(
            0,
            Math.floor(
              Number(seconds) || 0
            )
          );

        setTimeLeftState(
          normalized
        );
      },
      []
    );

  // =====================================================
  // ANSWER
  // =====================================================

  const selectAnswer =
    useCallback(
      (
        questionId: number,
        answers: number[]
      ) => {
        setSelectedAnswers(
          (previous) => ({
            ...previous,
            [questionId]:
              answers,
          })
        );
      },
      []
    );

  // =====================================================
  // SAVE ANSWER
  // =====================================================

  const saveAnswer =
    useCallback(
      (
        questionId: number
      ) => {
        const selected =
          selectedAnswers[
            questionId
          ] ?? [];

        setSavedAnswers(
          (previous) => ({
            ...previous,
            [questionId]:
              selected,
          })
        );
      },
      [selectedAnswers]
    );

  // =====================================================
  // IS SAVED
  // =====================================================

  const isQuestionSaved =
    useCallback(
      (
        questionId: number
      ) => {
        return (
          savedAnswers[
            questionId
          ] !== undefined
        );
      },
      [savedAnswers]
    );

  // =====================================================
  // STOP TIMER
  // =====================================================

  const stopTimer =
    useCallback(() => {
      if (
        timerIntervalRef.current !==
        null
      ) {
        window.clearInterval(
          timerIntervalRef.current
        );

        timerIntervalRef.current =
          null;
      }

      setTimerRunning(false);
    }, []);

  // =====================================================
  // START TIMER
  // =====================================================

  const startTimer =
    useCallback(() => {
      if (
        timerIntervalRef.current !==
        null
      ) {
        return;
      }

      const currentTime =
        Math.max(
          0,
          Math.floor(
            Number(timeLeft) || 0
          )
        );

      if (currentTime <= 0) {
        return;
      }

      deadlineRef.current =
        Date.now() +
        currentTime * 1000;

      console.log(
        "CONTEXT: TIMER START",
        {
          normalized:
            currentTime,

          deadline:
            new Date(
              deadlineRef.current
            ).toISOString(),
        }
      );

      const update = () => {
        const deadline =
          deadlineRef.current;

        if (
          deadline === null
        ) {
          return;
        }

        const remaining =
          Math.max(
            0,
            Math.ceil(
              (deadline -
                Date.now()) /
                1000
            )
          );

        setTimeLeftState(
          remaining
        );

        if (
          remaining <= 0
        ) {
          if (
            timerIntervalRef.current !==
            null
          ) {
            window.clearInterval(
              timerIntervalRef.current
            );

            timerIntervalRef.current =
              null;
          }

          deadlineRef.current =
            null;

          setTimerRunning(false);

          setTimeout(() => {
            setOnTimeExpiredState(
              (callback) => {
                if (callback) {
                  callback();
                }

                return callback;
              }
            );
          }, 0);
        }
      };

      update();

      timerIntervalRef.current =
        window.setInterval(
          update,
          250
        );

      setTimerRunning(true);
    }, [timeLeft]);

  // =====================================================
  // RESTORE SESSION
  //
  // ЄДИНЕ МІСЦЕ,
  // де серверний час перетворюється
  // на локальний countdown.
  // =====================================================

  const restoreSession =
    useCallback(
      (
        question: number,
        answers: UserAnswers,
        seconds: number,
        startedAt:
          | string
          | null,
        finished: boolean,
        blocked: boolean
      ) => {
        console.log(
          "CONTEXT: RESTORE SESSION CALLED",
          {
            seconds,
            startedAt,
            finished,
            blocked,
          }
        );

        setCurrentQuestion(
          question
        );

        setSelectedAnswers(
          answers
        );

        setSavedAnswers(
          answers
        );

        const normalized =
          Math.max(
            0,
            Math.floor(
              Number(seconds) || 0
            )
          );

        /*
         * Спочатку повністю прибираємо
         * попередній countdown.
         */

        if (
          timerIntervalRef.current !==
          null
        ) {
          window.clearInterval(
            timerIntervalRef.current
          );

          timerIntervalRef.current =
            null;
        }

        deadlineRef.current =
          null;

        setTimerRunning(false);

        setTimeLeftState(
          normalized
        );

        // =================================================
        // НЕ МОЖНА ЗАПУСКАТИ
        // =================================================

        if (
          !startedAt ||
          finished ||
          blocked ||
          normalized <= 0
        ) {
          console.log(
            "CONTEXT: TIMER NOT STARTED",
            {
              normalized,
              startedAt,
              finished,
              blocked,
            }
          );

          return;
        }

        // =================================================
        // НОВИЙ DEADLINE
        //
        // ВАЖЛИВО:
        //
        // Сервер уже визначив актуальний
        // залишок часу.
        //
        // Ми НЕ рахуємо:
        //
        // startedAt + duration
        //
        // бо сервер уже передав
        // актуальний timeLeft.
        // =================================================

        deadlineRef.current =
          Date.now() +
          normalized * 1000;

        console.log(
          "CONTEXT: TIMER START",
          {
            normalized,
            startedAt,

            deadline:
              new Date(
                deadlineRef.current
              ).toISOString(),
          }
        );

        const update = () => {
          const deadline =
            deadlineRef.current;

          if (
            deadline === null
          ) {
            return;
          }

          const remaining =
            Math.max(
              0,
              Math.ceil(
                (deadline -
                  Date.now()) /
                  1000
              )
            );

          setTimeLeftState(
            remaining
          );

          if (
            remaining <= 0
          ) {
            if (
              timerIntervalRef.current !==
              null
            ) {
              window.clearInterval(
                timerIntervalRef.current
              );

              timerIntervalRef.current =
                null;
            }

            deadlineRef.current =
              null;

            setTimerRunning(
              false
            );

            setTimeout(() => {
              setOnTimeExpiredState(
                (callback) => {
                  if (callback) {
                    callback();
                  }

                  return callback;
                }
              );
            }, 0);
          }
        };

        update();

        timerIntervalRef.current =
          window.setInterval(
            update,
            250
          );

        setTimerRunning(true);
      },
      []
    );

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      if (
        timerIntervalRef.current !==
        null
      ) {
        window.clearInterval(
          timerIntervalRef.current
        );

        timerIntervalRef.current =
          null;
      }
    };
  }, []);

  // =====================================================
  // RESET
  // =====================================================

  const resetTest =
    useCallback(() => {
      if (
        timerIntervalRef.current !==
        null
      ) {
        window.clearInterval(
          timerIntervalRef.current
        );

        timerIntervalRef.current =
          null;
      }

      sessionStorage.removeItem(
        "testSessionId"
      );

      localStorage.removeItem(
        "testSessionId"
      );

      setSessionIdState(null);

      setTest(null);

      setCurrentQuestion(0);

      setSelectedAnswers({});

      setSavedAnswers({});

      setTimeLeftState(0);

      setTimerRunning(false);

      deadlineRef.current =
        null;
    }, []);

  // =====================================================
  // PROVIDER
  // =====================================================

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

// =====================================================
// HOOK
// =====================================================

export function useTestSession() {
  const context =
    useContext(
      TestSessionContext
    );

  if (!context) {
    throw new Error(
      "useTestSession має використовуватися всередині TestSessionProvider"
    );
  }

  return context;
}