"use client";

import { useEffect } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

import { saveSession } from "@/app/services/session.api";


export default function AutoSaveSession() {

  const {
    test,
    currentQuestion,
    savedAnswers,
    timeLeft,
  } = useTestSession();



  useEffect(() => {

    if (!test) {
      return;
    }


    if (test.id === undefined) {
      return;
    }


    const testId = test.id;



    const interval = setInterval(
      async () => {

        try {

          await saveSession({

            testId,

            currentQuestion,

            savedAnswers,

            timeLeft,

            finished: false,

          });


        } catch (error) {

          console.error(
            "Помилка автозбереження сесії:",
            error
          );

        }

      },
      30000
    );



    return () => {

      clearInterval(interval);

    };


  }, [
    test,
    currentQuestion,
    savedAnswers,
    timeLeft,
  ]);



  return null;

}