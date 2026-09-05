"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type ComplexTestInfo = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  examType: string;
  section: string | null;
  codeRequired: boolean;
  tests: {
    id: number;
    order: number;
    title: string;
    subject: string;
    duration: number;
    questionCount: number;
  }[];
};

type ParticipantData = {
  lastName: string;
  firstName: string;
  middleName: string;
};

export default function ComplexTestInstructionsPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [test, setTest] = useState<ComplexTestInfo | null>(null);
  const [participant, setParticipant] =
    useState<ParticipantData | null>(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError("Некоректний ідентифікатор тесту.");
      setLoading(false);
      return;
    }

    const participantKey =
      `complex-test-participant-${id}`;

    const storedParticipant =
      sessionStorage.getItem(participantKey);

    if (!storedParticipant) {
      router.replace(`/complex-tests/${id}/start`);
      return;
    }

    try {
      const parsedParticipant =
        JSON.parse(storedParticipant) as ParticipantData;

      setParticipant(parsedParticipant);
    } catch {
      sessionStorage.removeItem(participantKey);
      router.replace(`/complex-tests/${id}/start`);
      return;
    }

    const loadTest = async () => {
      try {
        const response = await fetch(
          `/api/complex-tests/${id}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Не вдалося завантажити інформацію про тест."
          );
        }

        setTest(data.complexTest);
      } catch (err) {
        console.error(
          "LOAD COMPLEX TEST INSTRUCTIONS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося завантажити інформацію про тест."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [id, router]);

  const handleConfirm = async () => {
    if (!participant) {
      setError(
        "Дані учасника не знайдено. Поверніться до початку."
      );
      return;
    }

    if (!confirmed) {
      return;
    }

    setStarting(true);
    setError("");

    try {
      /*
       * ВАЖЛИВО:
       * запуск комбінованого тесту відбувається через
       * /api/complex-tests/start
       *
       * complexTestId передаємо в body.
       */
      const response = await fetch(
        `/api/complex-tests/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            complexTestId: id,
            lastName: participant.lastName,
            firstName: participant.firstName,
            middleName: participant.middleName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Не вдалося розпочати тестування."
        );
      }

      /*
       * Зберігаємо інформацію про сесію,
       * щоб сторінка тестування могла її отримати.
       */
      sessionStorage.setItem(
        `complex-test-session-${id}`,
        JSON.stringify({
          sessionId: data.sessionId,
          complexTestId: id,
          currentTestId: data.currentTestId,
          currentQuestion: data.currentQuestion,
          timeLeft: data.timeLeft,
        })
      );

      router.push(
        `/complex-tests/${id}/test`
      );
    } catch (err) {
      console.error(
        "START COMPLEX TEST ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося розпочати тестування. Спробуйте ще раз."
      );
    } finally {
      setStarting(false);
    }
  };

  const handleBack = () => {
    router.push(`/complex-tests/${id}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !test) {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
              {error}
            </div>

            <button
              type="button"
              onClick={handleBack}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7A1F2B] px-5 py-3 font-medium text-white transition hover:bg-[#641923]"
            >
              <ArrowLeft className="h-5 w-5" />
              Повернутися
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!test) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Верхня навігація */}
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#7A1F2B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Повернутися до тесту
        </button>

        {/* Основний блок */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Заголовок */}
          <div className="border-b border-gray-200 px-6 py-7 md:px-10">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#7A1F2B]/10 px-3 py-1 text-sm font-semibold text-[#7A1F2B]">
                {test.examType}
              </span>

              {test.section && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                  {test.section}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {test.title}
            </h1>
          </div>

          {/* Інструкція */}
          <div className="px-6 py-8 md:px-10">
            <div className="space-y-6 text-gray-700">
              <p className="text-center text-lg font-bold italic text-gray-900">
                Шановний учасник / учасниця тренувального
                тестування!
              </p>

              <p className="leading-relaxed">
                Перед початком виконання тестових завдань
                уважно ознайомтеся з правилами проходження
                тестування.
              </p>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Структура тесту
                </h2>

                <div className="space-y-3">
                  {test.tests.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-lg bg-white p-4 ring-1 ring-gray-200 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.subject}
                        </p>

                        <p className="text-sm text-gray-600">
                          {item.title}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 text-sm text-gray-600">
                        <span className="rounded-lg bg-gray-100 px-3 py-1.5">
                          {item.questionCount}{" "}
                          {item.questionCount === 1
                            ? "завдання"
                            : item.questionCount < 5
                              ? "завдання"
                              : "завдань"}
                        </span>

                        <span className="rounded-lg bg-gray-100 px-3 py-1.5">
                          {item.duration} хв
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Основні правила */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Правила проходження
                </h2>

                <ul className="list-disc space-y-3 pl-6 leading-relaxed">
                  <li>
                    Усі частини комбінованого тесту
                    виконуються в межах одного тестування.
                  </li>

                  <li>
                    Загальний час виконання тесту становить{" "}
                    <strong>
                      {test.duration} хвилин
                    </strong>
                    .
                  </li>

                  <li>
                    Уважно читайте кожне тестове завдання
                    перед вибором відповіді.
                  </li>

                  <li>
                    Після завершення тестування результати
                    будуть зафіксовані системою.
                  </li>

                  <li>
                    Не закривайте сторінку та не залишайте
                    тестування без необхідності.
                  </li>
                </ul>
              </div>

              <p className="pt-2 text-center text-lg font-bold italic text-black">
                Зичимо успіхів!
              </p>

              {/* Підтвердження */}
              <div className="border-t border-gray-200 pt-6">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-slate-50 px-5 py-4 transition hover:border-gray-300">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) =>
                      setConfirmed(
                        event.target.checked
                      )
                    }
                    disabled={starting}
                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#7A1F2B]"
                  />

                  <span className="text-gray-700 leading-relaxed">
                    Я ознайомився / ознайомилася з
                    правилами проходження тестування та
                    погоджуюся дотримуватися їх.
                  </span>
                </label>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!confirmed || starting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A1F2B] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#641923] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {starting ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Розпочинаємо тестування...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Ознайомлений(а) — розпочати тестування
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}