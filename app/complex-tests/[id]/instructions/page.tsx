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
  codeRequired: boolean;
};

type ParticipantData = {
  lastName: string;
  firstName: string;
  middleName: string;
  accessCode: string;
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

        {/* Повернення */}
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
            </div>

            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {test.title}
            </h1>
          </div>

          {/* Інструкція */}
          <div className="px-6 py-8 md:px-10">
            <div className="space-y-6 text-gray-700">

              {/* Звернення */}
              <p className="text-center text-lg font-bold italic text-gray-900">
                Шановний учасник / учасниця тренувального
                тестування!
              </p>

              {/* Основний текст інструкції */}
              <div className="space-y-5 text-base leading-relaxed text-gray-700">

                <p>
                  Обов’язково ознайомтеся з правилами
                  проходження тестування та правилами роботи
                  із сервісом і натисніть на кнопку
                  «Ознайомлений / Ознайомлена з правилами
                  проходження тестування». Наголошуємо, що в
                  разі порушення цих правил вас буде позбавлено
                  права продовжувати роботу, а ваші результати
                  буде анульовано.
                </p>

                <p>
                  Зауважуємо: у ТЕЦ може бути здійснено
                  контроль за дотриманням процедури проходження
                  НМТ за допомогою металодетектора. Також у ТЕЦ
                  здійснюється відеоспостереження.
                </p>

                <p>
                  Якщо ви забули вимкнути мобільні телефони чи
                  залишити їх або зарядні пристрої, смартгодинники,
                  навушники в спеціально відведеному місці —
                  пропонуємо зробити це зараз. У разі виникнення
                  технічних збоїв у роботі сервісу або погіршення
                  самопочуття потрібно негайно повідомити про це
                  інструктора.
                </p>

                <p>
                  Якщо ви вважатимете, що щодо вас допущено
                  порушення процедури проведення НМТ, що може
                  вплинути на ваш результат, — до виходу з
                  тимчасового екзаменаційного центру (ТЕЦ)
                  подайте відповідальному за ТЕЦ апеляційну
                  заяву щодо порушення процедури.
                </p>

                <p>
                  У випадку оголошення повітряної тривоги до
                  початку допуску до ТЕЦ пройдіть в укриття за
                  вказівниками та перебувайте там до повідомлення
                  про її завершення. Якщо ж повітряну тривогу
                  оголосять під час тестування — вас буде
                  повідомлено про це, а роботу над тестом
                  заблоковано.
                </p>

                <p>
                  Якщо ви не зможете завершити виконання роботи
                  через виникнення нестандартних ситуацій у ТЕЦ
                  або через різке погіршення стану здоров’я, вам
                  буде надано змогу пройти НМТ під час додаткових
                  сесій відповідно до встановленого порядку.
                </p>

                <p>
                  Під час кожного етапу тестування передбачено
                  виконання завдань із двох предметів, час між
                  якими ви можете розподіляти самостійно. Таймер
                  відліку часу, що показує час, який залишився до
                  завершення відповідного етапу тестування,
                  відображатиметься у правому верхньому куті
                  екрана.
                </p>

                <p>
                  Розпочати роботу над тестом ви можете як з
                  української мови, так і з математики.
                  Повернутися до виконання завдань одного із цих
                  предметів і надати та зберегти відповіді можна
                  протягом усього часу, відведеного на виконання
                  завдань першого етапу тестування. Переходячи
                  від одного предмета до іншого, уважно читайте
                  спливні повідомлення. Для зарахування відповіді
                  на завдання натисніть на кнопку «Зберегти
                  відповідь».
                </p>

                <p>
                  Для виправлення відповіді виберіть інший
                  варіант та повторно натисніть на кнопку
                  «Зберегти відповідь» – у такому разі буде
                  зараховано останню збережену вами відповідь.
                  На боковій панелі, розташованій справа,
                  відображатиметься інформація про опрацьовані
                  вами завдання.
                </p>

                <p>
                  За потреби ви можете користуватися
                  довідковими матеріалами з математики, фізики
                  чи хімії, що містяться у вкладці
                  «Довідкові матеріали».
                </p>

                <p>
                  На боковій панелі, розташованій праворуч,
                  відображатиметься інформація про опрацювання
                  вами завдань.
                </p>

                <p>
                  Стежте за вказівками, які з’являються на
                  моніторі комп’ютера, а також читайте
                  інформацію у спливних повідомленнях.
                </p>

                <p>
                  Якщо ви дочасно закінчите роботу над
                  завданнями — можете завершити тестування,
                  натиснувши кнопку «Завершити роботу над
                  тестом».
                </p>

                <p>
                  Будьте уважні: перед завершенням роботи
                  система повідомить, на які завдання ви не
                  надали або не зберегли відповіді.
                </p>

                <p>
                  Після завершення виконання завдань тестування
                  на екрані відобразиться інформація про
                  збережені вами відповіді та набрані тестові
                  бали.
                </p>

                <p>
                  Якщо вам потрібна допомога у вирішенні питань,
                  які не стосуються змісту завдань тесту,
                  піднесіть руку, і до вас підійде старший
                  інструктор.
                </p>

              </div>

              {/* Побажання */}
              <p className="pt-2 text-center text-lg font-bold italic text-black">
                Зичимо успіхів!
              </p>

              {/* Підтвердження ознайомлення */}
              <div className="border-t border-gray-200 pt-6">

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) =>
                      setConfirmed(event.target.checked)
                    }
                    disabled={starting}
                    className="h-5 w-5 shrink-0 cursor-pointer accent-[#7A1F2B]"
                  />

                  <span className="text-base font-medium text-gray-900">
                    Ознайомлений / Ознайомлена з правилами
                    проходження тестування
                  </span>
                </label>

                {/* Помилка */}
                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Кнопка запуску */}
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
                      Розпочати роботу над тестом
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