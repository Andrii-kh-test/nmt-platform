"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

const RANDOM_NAMES = [
  "Калашник Марія Василівна",
  "Петренко Семен Олександрович",
  "Бондаренко Олена Сергіївна",
  "Мельник Дмитро Ігорович",
  "Шевченко Анна Петрівна",
  "Кравченко Максим Олександрович",
  "Ткаченко Софія Андріївна",
  "Романенко Владислав Сергійович",
  "Олійник Катерина Миколаївна",
  "Мороз Артем Вікторович",
  "Лисенко Дарина Олексіївна",
  "Савченко Богдан Романович",
  "Ковальчук Ірина Василівна",
  "Гнатюк Назар Андрійович",
  "Поліщук Марина Олегівна",
  "Захарченко Єгор Павлович",
  "Іваненко Вікторія Сергіївна",
  "Сидоренко Павло Михайлович",
  "Даниленко Юлія Володимирівна",
  "Білик Олексій Олександрович",
];

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

function getParticipantFullName(
  participant: ParticipantData
): string {
  return [
    participant.lastName,
    participant.firstName,
    participant.middleName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function createIdentityOptions(
  participant: ParticipantData
): IdentityOption[] {
  const participantName =
    getParticipantFullName(participant);

  const randomNames = shuffle(
    RANDOM_NAMES.filter(
      (name) => name !== participantName
    )
  ).slice(0, 2);

  return shuffle([
    {
      id: 1,
      name: participantName,
      correct: true,
    },
    {
      id: 2,
      name: randomNames[0],
      correct: false,
    },
    {
      id: 3,
      name: randomNames[1],
      correct: false,
    },
  ]);
}

export default function TestIdentityPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);

  const [
    participant,
    setParticipant,
  ] = useState<ParticipantData | null>(null);

  const [
    identityOptions,
    setIdentityOptions,
  ] = useState<IdentityOption[]>([]);

  const [
    selectedIdentity,
    setSelectedIdentity,
  ] = useState<number | null>(null);

  const [
    identityConfirmed,
    setIdentityConfirmed,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    starting,
    setStarting,
  ] = useState(false);

  useEffect(() => {
    /*
     * Звичайний тест зберігає дані учасника
     * у localStorage під ключем "participant".
     */
    const storedParticipant =
      localStorage.getItem(
        "participant"
      );

    if (!storedParticipant) {
      router.replace(
        `/test/start/${id}`
      );

      return;
    }

    /*
     * Перевіряємо, що існує вже створена
     * сесія тестування.
     *
     * НОВУ сесію тут НЕ створюємо.
     */
    const sessionId =
      localStorage.getItem(
        "testSessionId"
      ) ??
      sessionStorage.getItem(
        "testSessionId"
      );

    if (!sessionId) {
      router.replace(
        `/test/start/${id}`
      );

      return;
    }

    try {
      const parsed: ParticipantData =
        JSON.parse(storedParticipant);

      if (
        !parsed.lastName ||
        !parsed.firstName ||
        !parsed.accessCode
      ) {
        router.replace(
          `/test/start/${id}`
        );

        return;
      }

      setParticipant(parsed);

      setIdentityOptions(
        createIdentityOptions(parsed)
      );
    } catch {
      localStorage.removeItem(
        "participant"
      );

      router.replace(
        `/test/start/${id}`
      );
    }
  }, [id, router]);

  const handleIdentitySelect = (
    option: IdentityOption
  ) => {
    setSelectedIdentity(option.id);

    setError("");

    if (option.correct) {
      setIdentityConfirmed(true);
    } else {
      setIdentityConfirmed(false);

      setError(
        "Ви обрали неправильне ПІБ. Будь ласка, оберіть своє ПІБ."
      );
    }
  };

  const handleStartTest = async () => {
    if (!participant) {
      setError(
        "Не знайдено дані учасника тестування."
      );

      return;
    }

    if (!identityConfirmed) {
      setError(
        "Спочатку підтвердьте свою особу."
      );

      return;
    }

    /*
     * Перевіряємо, що існуюча сесія
     * все ще є.
     *
     * ВАЖЛИВО:
     * нову сесію НЕ створюємо.
     */
    const sessionId =
      localStorage.getItem(
        "testSessionId"
      ) ??
      sessionStorage.getItem(
        "testSessionId"
      );

    if (!sessionId) {
      setError(
        "Сесію тестування не знайдено. Будь ласка, розпочніть тестування ще раз."
      );

      return;
    }

    const numericSessionId =
      Number(sessionId);

    if (
      !Number.isInteger(
        numericSessionId
      ) ||
      numericSessionId <= 0
    ) {
      setError(
        "Некоректний ідентифікатор сесії."
      );

      return;
    }

    setStarting(true);
    setError("");

    /*
     * Повноекранний режим запускаємо
     * безпосередньо після натискання
     * користувачем кнопки.
     */
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (fullscreenError) {
        console.error(
          "Не вдалося перейти у повноекранний режим:",
          fullscreenError
        );

        setStarting(false);

        setError(
          "Не вдалося перейти у повноекранний режим. Спробуйте ще раз."
        );

        return;
      }
    }

    /*
     * ВАЖЛИВО:
     *
     * Тут НЕ викликаємо:
     *
     * POST /api/test/start
     *
     * і НЕ викликаємо:
     *
     * POST /api/test/begin
     *
     * Сесія вже існує.
     *
     * Офіційний початок тестування
     * та запуск часу виконає
     * SessionMonitor на сторінці завдань.
     */

    console.log(
      "IDENTITY: GO TO TEST",
      {
        testId: Number(id),
        sessionId: numericSessionId,
      }
    );

    /*
     * Переходимо безпосередньо
     * на сторінку завдань.
     */
    router.push(
      `/test/${id}`
    );
  };

  if (
    !participant ||
    identityOptions.length !== 3
  ) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">
          Завантаження...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="fixed inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">

          <h1 className="text-3xl md:text-4xl font-bold text-[#7A1F2B] mb-6 text-center">
            Підтвердження особи
          </h1>

          <p className="text-lg text-gray-700 text-center mb-8">
            Оберіть своє ПІБ із запропонованих
            варіантів.
          </p>

          <div className="space-y-4">
            {identityOptions.map(
              (option) => {
                const isSelected =
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
                      text-left
                      rounded-xl
                      border-2
                      px-6
                      py-5
                      text-lg
                      transition
                      ${
                        isSelected &&
                        option.correct
                          ? "border-[#7A1F2B] bg-[#7A1F2B]/10"
                          : isSelected
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 bg-white hover:border-[#7A1F2B] hover:bg-gray-50"
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
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              {error}
            </div>
          )}

          {identityConfirmed && (
            <div className="mt-8">
              <button
                type="button"
                onClick={
                  handleStartTest
                }
                disabled={starting}
                className="
                  w-full
                  px-8
                  py-4
                  rounded-xl
                  bg-[#7A1F2B]
                  hover:bg-[#651824]
                  disabled:bg-gray-400
                  text-white
                  text-lg
                  font-semibold
                  transition
                "
              >
                {starting
                  ? "Підготовка до тестування..."
                  : "Розпочати роботу над тестом"}
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}