"use client";

import { useEffect } from "react";

import { useTestSession } from "@/app/context/TestSessionContext";

import { loadSession } from "@/app/services/session.api";


export default function RestoreSession() {

  const {
    test,
    restoreSession,
  } = useTestSession();


  useEffect(() => {


    async function checkSession() {


      if (!test) {
        return;
      }


      if (test.id === undefined) {
        return;
      }


      try {


        const testId = test.id;


        const data =
          await loadSession(testId);



        if (data) {


          restoreSession(

            data.currentQuestion,

            data.savedAnswers,

            data.timeLeft

          );


        }


      } catch (error) {


        console.error(
          "Помилка відновлення сесії:",
          error
        );


      }


    }



    checkSession();



  }, [
    test,
    restoreSession,
  ]);



  return null;

}