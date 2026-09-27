"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTestSession } from "@/app/context/TestSessionContext";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type ParticipantData = {
  lastName: string;
  firstName: string;
  middleName: string;
  accessCode: string;
};

type IdentityOption = {
  id: number;
  name: string;
  correct: boolean;
};

// =====================================================
// ВИПАДКОВІ ІМЕНА ДЛЯ НЕПРАВИЛЬНИХ ВАРІАНТІВ
// =====================================================

const RANDOM_NAMES = [
  "Бондаренко Олександр Петрович",
  "Коваленко Марія Ігорівна",
  "Мельник Андрій Олексійович",
  "Шевченко Наталія Василівна",
  "Ткаченко Дмитро Сергійович",
  "Кравченко Олена Миколаївна",
  "Петренко Максим Вікторович",
  "Савченко Анна Олександрівна",
  "Романенко Владислав Іванович",
  "Лисенко Катерина Андріївна",
  "Гончаренко Богдан Петрович",
  "Марченко Юлія Олегівна",
  "Захарченко Денис Михайлович",
  "Федоренко Ірина Володимирівна",
  "Поліщук Артем Сергійович",
  "Даниленко Софія Романівна",
  "Олійник Роман Васильович",
  "Козак Анастасія Дмитрівна",
  "Власенко Євген Павлович",
  "Мороз Наталія Ігорівна",
];

// =====================================================
// SHUFFLE
// =====================================================

function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

// =====================================================
// ПОВНЕ ПІБ
// =====================================================

function getParticipantFullName(
  participant: ParticipantData
) {
  return [
    participant.lastName,
    participant.firstName,
    participant.middleName,
  ]
    .filter(Boolean)
    .join(" ");
}

// =====================================================
// СТВОРЕННЯ ВАРІАНТІВ ПІБ
// =====================================================

function createIdentityOptions(
  participant: ParticipantData
): IdentityOption[] {
  const correctName =
    getParticipantFullName(participant);

  const distractors = shuffle(
    RANDOM_NAMES.filter(
      (name) => name !== correctName
    )
  ).slice(0, 2);

  return shuffle([
    {
      id: 1,
      name: correctName,
      correct: true,
    },
    {
      id: 2,
      name: distractors[0],
      correct: false,
    },
    {
      id: 3,
      name: distractors[1],
      correct: false,
    },
  ]);
}

// =====================================================
// PAGE
// =====================================================

export default function InstructionPage({
  params,
}: Props) {
  const { id } = use(params);

  const router = useRouter();

  const {
    stopTimer,
    setSessionId,
  } = useTestSession();

  const [accepted, setAccepted] =
    useState(false);

  const [starting, setStarting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [participant, setParticipant] =
    useState<ParticipantData | null>(null);

  const [identityOptions, setIdentityOptions] =
    useState<IdentityOption[]>([]);

  const [selectedIdentity, setSelectedIdentity] =
    useState<number | null>(null);

  const [identityConfirmed, setIdentityConfirmed] =
    useState(false);

  // ===================================================
  // ЗУПИНЯЄМО ТАЙМЕР НА СТОРІНЦІ ІНСТРУКЦІЇ
  // ===================================================

  useEffect(() => {
    stopTimer();
  }, [stopTimer]);

  // ===================================================
  // ЗАВАНТАЖУЄМО ПІБ УЧАСНИКА
  // ===================================================

  useEffect(() => {
    try {
      const storedParticipant =
        localStorage.getItem("participant");

      if (!storedParticipant) {
        router.replace(`/test/start/${id}`);
        return;
      }

      const parsed =
        JSON.parse(storedParticipant);

      if (
        !parsed ||
        typeof parsed.lastName !== "string" ||
        typeof parsed.firstName !== "string" ||
        typeof parsed.accessCode !== "string"
      ) {
        localStorage.removeItem("participant");

        router.replace(`/test/start/${id}`);
        return;
      }

      const participantData: ParticipantData = {
        lastName: parsed.lastName,
        firstName: parsed.firstName,
        middleName:
          typeof parsed.middleName === "string"
            ? parsed.middleName
            : "",
        accessCode: parsed.accessCode,
      };

      setParticipant(participantData);

      setIdentityOptions(
        createIdentityOptions(
          participantData
        )
      );
    } catch (error) {
      console.error(
        "Помилка читання даних учасника:",
        error
      );

      router.replace(`/test/start/${id}`);
    }
  }, [id, router]);

  // ===================================================
  // ПІДТВЕРДЖЕННЯ ОСОБИ
  // ===================================================

  const handleIdentitySelect = (
    option: IdentityOption
  ) => {
    setSelectedIdentity(option.id);

    if (option.correct) {
      setIdentityConfirmed(true);
      setError(null);
    } else {
      setIdentityConfirmed(false);

      setError(
        "Ви обрали неправильне ПІБ. Будь ласка, оберіть своє ПІБ."
      );
    }
  };

  // ===================================================
  // ПОЧАТОК ТЕСТУ
  // ===================================================

  const handleStartTest = async () => {
    if (
      !accepted ||
      starting ||
      !participant ||
      !identityConfirmed
    ) {
      return;
    }

    setStarting(true);
    setError(null);

    const testId = Number(id);

    if (
      !Number.isInteger(testId) ||
      testId <= 0
    ) {
      setError("Некоректний id тесту.");
      setStarting(false);
      return;
    }

    // -----------------------------------------------
    // Перевіряємо існуючу сесію
    // -----------------------------------------------

    const sessionStorageId =
      sessionStorage.getItem(
        "testSessionId"
      );

    const localStorageId =
      localStorage.getItem(
        "testSessionId"
      );

    const storedSessionId =
      sessionStorageId ??
      localStorageId;

    if (!storedSessionId) {
      setError(
        "Сесію тестування не знайдено. Будь ласка, розпочніть тестування ще раз."
      );

      setStarting(false);
      return;
    }

    const sessionId =
      Number(storedSessionId);

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      setError(
        "Некоректний id сесії."
      );

      setStarting(false);
      return;
    }

    // -----------------------------------------------
    // Зберігаємо sessionId у Context
    // -----------------------------------------------

    setSessionId(sessionId);

    // -----------------------------------------------
    // Переходимо у fullscreen
    // -----------------------------------------------

    try {
      if (
        !document.fullscreenElement &&
        document.documentElement.requestFullscreen
      ) {
        await document.documentElement.requestFullscreen();
      }
    } catch (fullscreenError) {
      console.error(
        "Помилка переходу у fullscreen:",
        fullscreenError
      );

      setError(
        "Не вдалося перейти в повноекранний режим. Будь ласка, дозвольте повноекранний режим і спробуйте ще раз."
      );

      setStarting(false);
      return;
    }

    // -----------------------------------------------
    // Переходимо до тесту
    //
    // POST /api/test/begin тут НЕ викликаємо.
    // Офіційний початок тесту виконає
    // SessionMonitor на сторінці завдань.
    // -----------------------------------------------

    console.log(
      "INSTRUCTION: IDENTITY CONFIRMED → GO TO TEST",
      {
        testId,
        sessionId,
      }
    );

    router.push(`/test/${testId}`);
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-8 md:p-12">

        {/* =================================================
            ІНСТРУКЦІЯ
        ================================================= */}

        {!identityConfirmed && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-[#7A1F2B] mb-8 text-center">
              Інструкція щодо проходження тестування
            </h1>

            <div className="space-y-5 text-gray-800 leading-relaxed">

              <p>
                Перед початком виконання тесту уважно
                ознайомтеся з правилами його проходження.
              </p>

              <p>
                Під час виконання тесту уважно читайте
                умови завдань та обирайте відповіді,
                які вважаєте правильними.
              </p>

              <p>
                Для переходу до наступного завдання
                використовуйте відповідні елементи
                керування на сторінці тестування.
              </p>

              <p>
                Після завершення роботи результати
                тестування будуть опрацьовані системою.
              </p>

              <div className="mt-8 border-t pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="agree"
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => {
                      setAccepted(
                        event.target.checked
                      );
                      setError(null);
                    }}
                    className="mt-1 h-5 w-5"
                  />

                  <span className="text-lg">
                    Ознайомлений / Ознайомлена з
                    правилами проходження тестування
                  </span>
                </label>
              </div>

              {error && (
                <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-center pt-6">
                <button
                  type="button"
                  disabled={!accepted || starting}
                  onClick={() => {
                    setError(null);

                    // Після ознайомлення відкриваємо
                    // блок підтвердження особи.
                    if (accepted) {
                      setIdentityConfirmed(false);
                      setSelectedIdentity(null);
                    }
                  }}
                  className="
                    rounded-xl
                    bg-[#7A1F2B]
                    px-8
                    py-4
                    text-lg
                    font-semibold
                    text-white
                    transition
                    hover:bg-[#641923]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Продовжити
                </button>
              </div>
            </div>
          </>
        )}

        {/* =================================================
            ПІДТВЕРДЖЕННЯ ОСОБИ
        ================================================= */}

        {accepted && !identityConfirmed && (
          <div className="mt-10 border-t pt-10">

            <h2 className="text-3xl font-bold text-[#7A1F2B] mb-4 text-center">
              Підтвердження особи
            </h2>

            <p className="text-xl text-center text-gray-700 mb-8">
              Оберіть своє ПІБ із запропонованих
              варіантів.
            </p>

            <div className="max-w-2xl mx-auto space-y-4">
              {identityOptions.map(
                (option) => {
                  const selected =
                    selectedIdentity ===
                    option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        handleIdentitySelect(
                          option
                        )
                      }
                      className={`
                        w-full
                        rounded-xl
                        border-2
                        px-6
                        py-5
                        text-left
                        text-lg
                        font-medium
                        transition
                        ${
                          selected
                            ? option.correct
                              ? "border-green-500 bg-green-50 text-green-800"
                              : "border-red-500 bg-red-50 text-red-800"
                            : "border-gray-300 bg-white hover:border-[#7A1F2B] hover:bg-gray-50"
                        }
                      `}
                    >
                      {option.name}
                    </button>
                  );
                }
              )}
            </div>

            {error && (
              <div className="max-w-2xl mx-auto mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700 text-center">
                {error}
              </div>
            )}

            <div className="flex justify-center pt-8">
              <button
                type="button"
                disabled={
                  !identityConfirmed ||
                  starting
                }
                onClick={
                  handleStartTest
                }
                className="
                  rounded-xl
                  bg-[#7A1F2B]
                  px-10
                  py-4
                  text-lg
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#641923]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {starting
                  ? "Підготовка до тесту..."
                  : "Розпочати роботу над тестом"}
              </button>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}