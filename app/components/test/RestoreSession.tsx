"use client";

import { useEffect, useState } from "react";

import {
  loadSession,
  deleteSession,
} from "@/app/services/session.api";

import { useTestSession } from "@/app/context/TestSessionContext";

export default function RestoreSession() {
  const {
    test,
    restoreSession,
  } = useTestSession();

  const [checked, setChecked] =
    useState(false);

  const [session, setSession] =
    useState<any>(null);

  useEffect(() => {
    if (!test || checked) {
      return;
    }

    async function checkSession() {
      try {
        if (!test) {
  return;
}

const data = await loadSession(test.id);

        if (data) {
          setSession(data);
        }

        setChecked(true);
      } catch (error) {
        console.error(
          "Помилка перевірки сесії:",
          error
        );

        setChecked(true);
      }
    }

    checkSession();
  }, [test, checked]);

  if (!session) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">

        <h2 className="text-3xl font-bold text-[#7A1F2B] mb-6">
          Незавершене тестування
        </h2>

        <p className="text-lg leading-8 mb-8">

          Було знайдено незавершене проходження тесту.

          <br />
          <br />

          Бажаєте продовжити його?

        </p>

        <div className="flex gap-4">

          <button
            type="button"
            onClick={() => {

              restoreSession(
                session.currentQuestion,
                session.savedAnswers,
                session.timeLeft
              );

              setSession(null);

            }}
            className="
              flex-1
              py-3
              rounded-xl
              bg-[#7A1F2B]
              hover:bg-[#651722]
              text-white
              font-semibold
              transition
            "
          >
            Продовжити
          </button>

          <button
            type="button"
            onClick={async () => {

              try {

                if (test) {
                  await deleteSession(
                    test.id
                  );
                }

              } catch (error) {

                console.error(
                  "Помилка видалення сесії:",
                  error
                );

              }

              setSession(null);

            }}
            className="
              flex-1
              py-3
              rounded-xl
              bg-gray-200
              hover:bg-gray-300
              font-semibold
              transition
            "
          >
            Почати заново
          </button>

        </div>

      </div>

    </div>
  );
}