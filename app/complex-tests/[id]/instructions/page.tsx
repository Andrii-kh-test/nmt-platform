"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type ParticipantData = {
  lastName: string;
  firstName: string;
  middleName: string;
  accessCode: string;
};

type ComplexTest = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  examType: string;
  codeRequired: boolean;
};

export default function ComplexTestInstructionsPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [participant, setParticipant] =
    useState<ParticipantData | null>(null);

  const [complexTest, setComplexTest] =
    useState<ComplexTest | null>(null);

  const [confirmed, setConfirmed] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [starting, setStarting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const storedParticipant =
      sessionStorage.getItem(
        `complex-test-participant-${id}`
      );

    if (!storedParticipant) {
      router.replace(`/complex-tests/${id}/start`);
      return;
    }

    try {
      const parsedParticipant =
        JSON.parse(storedParticipant);

      setParticipant(parsedParticipant);
    } catch {
      sessionStorage.removeItem(
        `complex-test-participant-${id}`
      );

      router.replace(`/complex-tests/${id}/start`);
      return;
    }

    async function loadComplexTest() {
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
              "Не вдалося завантажити тест."
          );
        }

        setComplexTest(data.complexTest);
      } catch (err) {
        console.error(
          "Помилка завантаження комбінованого тесту:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Не вдалося завантажити тест."
        );
      } finally {
        setLoading(false);
      }
    }

    loadComplexTest();
  }, [id, router]);

  async function handleConfirm() {
    if (!participant) {
      setError(
        "Не знайдено дані учасника тестування."
      );
      return;
    }

    if (!confirmed) {
      setError(
        "Підтвердьте, що ви ознайомилися з інструкцією."
      );
      return;
    }

    setError("");

    /*
     * Переходимо в повноекранний режим безпосередньо
     * з обробника натискання кнопки.
     *
     * Це важливо, оскільки браузер дозволяє
     * requestFullscreen() саме в межах дії користувача.
     */
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (fullscreenError) {
        console.error(
          "Не вдалося перейти у повноекранний режим:",
          fullscreenError
        );

        setError(
          "Не вдалося перейти у повноекранний режим. Спробуйте ще раз."
        );

        return;
      }
    }

    setStarting(true);

    try {
      const response = await fetch(
        "/api/complex-tests/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            complexTestId: id,
            lastName: participant.lastName,
            firstName: participant.firstName,
            middleName: participant.middleName,
            accessCode: participant.accessCode,
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

      sessionStorage.setItem(
        `complex-test-session-${id}`,
        JSON.stringify({
          sessionId: data.session.id,
          complexTestId: id,
          currentTestId:
            data.session.currentTestId,
          currentQuestion:
            data.session.currentQuestion,
          timeLeft:
            data.session.timeLeft,
        })
      );

      router.push(
        `/complex-tests/${id}/test`
      );
    } catch (err) {
      console.error(
        "Помилка запуску комбінованого тесту:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося розпочати тестування."
      );

      setStarting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">
          Завантаження...
        </div>
      </main>
    );
  }

  if (!complexTest) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full text-center">
          <h1 className="text-2xl font-bold text-[#7A1F2B] mb-4">
            Тест не знайдено
          </h1>

          <p className="text-gray-600 mb-6">
            {error ||
              "Не вдалося завантажити інформацію про тест."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/complex-tests")
            }
            className="
              inline-flex
              items-center
              gap-2
              px-6
              py-3
              rounded-xl
              bg-[#7A1F2B]
              hover:bg-[#651722]
              text-white
              font-semibold
              transition
            "
          >
            <ArrowLeft size={18} />
            До переліку тестів
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Заголовок */}
          <div className="bg-[#7A1F2B] text-white px-8 py-7">
            <div className="text-sm opacity-80 mb-2">
              {complexTest.examType}
            </div>

            <h1 className="text-3xl font-bold">
              {complexTest.title}
            </h1>

            {complexTest.description && (
              <p className="mt-3 text-white/90 leading-7">
                {complexTest.description}
              </p>
            )}
          </div>

          {/* Основна інформація */}
          <div className="px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
                <div className="text-sm text-gray-500 mb-1">
                  Учасник
                </div>

                <div className="font-semibold text-gray-800">
                  {participant?.lastName}{" "}
                  {participant?.firstName}{" "}
                  {participant?.middleName}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
                <div className="text-sm text-gray-500 mb-1">
                  Тривалість тестування
                </div>

                <div className="font-semibold text-gray-800">
                  {complexTest.duration} хвилин
                </div>
              </div>
            </div>

            {/* Інструкція */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Інструкція
              </h2>

              <div className="space-y-5 text-gray-700 leading-7">
                <p>
                  Перед початком тестування уважно
                  ознайомтеся з правилами його
                  проходження.
                </p>

                <p>
                  Тест складається з кількох предметних
                  блоків, які проходяться послідовно.
                  Перехід до наступного предмета
                  здійснюється після завершення
                  поточного блоку.
                </p>

                <p>
                  Під час тестування необхідно
                  дотримуватися правил академічної
                  доброчесності та не залишати
                  повноекранний режим.
                </p>

                <p>
                  Заборонено використовувати сторонні
                  матеріали, інші вкладки браузера,
                  сторонні програми або інші засоби
                  отримання допомоги.
                </p>

                <p>
                  У разі виходу з повноекранного режиму
                  система зафіксує порушення правил
                  тестування. Повторне порушення може
                  призвести до автоматичного завершення
                  тестування.
                </p>

                <p>
                  Усі надані та збережені відповіді
                  використовуються для формування
                  результатів тестування.
                </p>

                <p>
                  Після завершення тестування або
                  автоматичного завершення через
                  порушення правил результати будуть
                  доступні на відповідній сторінці.
                </p>
              </div>
            </section>

            {/* Підтвердження та запуск */}
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <label className="flex items-center gap-3 cursor-pointer text-gray-700">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) =>
                    setConfirmed(e.target.checked)
                  }
                  className="
                    h-5
                    w-5
                    accent-[#7A1F2B]
                  "
                />

                <span>
                  Ознайомлений з інструкцією
                </span>
              </label>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  !confirmed || starting
                }
                className="
                  px-7
                  py-3
                  rounded-xl
                  bg-[#7A1F2B]
                  hover:bg-[#651722]
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  text-white
                  font-semibold
                  transition
                  whitespace-nowrap
                "
              >
                {starting
                  ? "Розпочинаємо..."
                  : "Розпочати роботу над тестом"}
              </button>
            </div>

            {/* Помилка */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}