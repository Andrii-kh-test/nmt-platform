"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";

type ComplexTestInfo = {
  id: number;
  title: string;
  examType: string;
};

type ParticipantData = {
  lastName: string;
  firstName: string;
  middleName: string;
  accessCode: string;
};

export default function ComplexTestInstructionsPage() {
  const router = useRouter();
  const params = useParams();

  const id = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [complexTest, setComplexTest] =
    useState<ComplexTestInfo | null>(null);

  const [participant, setParticipant] =
    useState<ParticipantData | null>(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const savedParticipant =
          sessionStorage.getItem(
            `complex-test-participant-${id}`
          );

        if (!savedParticipant) {
          router.replace(
            `/complex-tests/${id}/start`
          );
          return;
        }

        const participantData =
          JSON.parse(savedParticipant) as ParticipantData;

        setParticipant(participantData);

        const response = await fetch(
          `/api/complex-tests/${id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(
            data.message ||
              "Не вдалося завантажити інформацію про тест."
          );
          return;
        }

        setComplexTest({
          id: data.complexTest.id,
          title: data.complexTest.title,
          examType: data.complexTest.examType,
        });
      } catch (error) {
        console.error(error);

        setError(
          "Не вдалося завантажити сторінку інструкції."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id, router]);

  async function handleConfirm() {
    if (!participant) {
      setError(
        "Дані учасника не знайдено. Поверніться до початку."
      );
      return;
    }

    setError("");
    setStarting(true);

    try {
      const response = await fetch(
        `/api/complex-tests/${id}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            complexTestId: Number(id),
            lastName: participant.lastName,
            firstName: participant.firstName,
            middleName: participant.middleName,
            accessCode: participant.accessCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Не вдалося розпочати тестування."
        );
        return;
      }

      sessionStorage.setItem(
        `complex-test-session-${id}`,
        JSON.stringify({
          sessionId: data.sessionId,
          participantId: data.participantId,
          complexTestId: data.complexTestId,
        })
      );

      router.push(
        `/complex-tests/${id}/test/${data.sessionId}`
      );
    } catch (error) {
      console.error(error);

      setError(
        "Не вдалося розпочати тестування. Спробуйте ще раз."
      );
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-lg text-gray-500">
          Завантаження інструкції...
        </div>
      </main>
    );
  }

  if (error && !complexTest) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            Не вдалося завантажити інструкцію
          </h1>

          <p className="mt-4 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/complex-tests/${id}/start`
              )
            }
            className="mt-8 rounded-xl bg-[#7A1F2B] px-7 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Повернутися
          </button>
        </div>
      </main>
    );
  }

  if (!complexTest || !participant) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        {/* Верхня частина */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/complex-tests/${id}/start`
              )
            }
            className="inline-flex items-center gap-2 text-gray-500 transition hover:text-[#7A1F2B]"
          >
            <ArrowLeft className="h-5 w-5" />
            Назад
          </button>
        </div>

        {/* Заголовок */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#7A1F2B] shadow-md">
              <CheckCircle2
                className="h-8 w-8 text-white"
                strokeWidth={2}
              />
            </div>

            <div className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-[#7A1F2B]">
              {complexTest.examType}
            </div>

            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-[#7A1F2B]">
              Правила проходження тестування
            </h1>

            <p className="mt-4 text-gray-600">
              {complexTest.title}
            </p>
          </div>

          {/* Учасник */}
          <div className="mt-8 rounded-xl bg-slate-50 border border-gray-200 px-5 py-4">
            <p className="text-sm text-gray-500">
              Учасник / учасниця
            </p>

            <p className="mt-1 text-lg font-semibold text-gray-800">
              {participant.lastName}{" "}
              {participant.firstName}{" "}
              {participant.middleName}
            </p>
          </div>

          {/* Попередження */}
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />

              <div>
                <p className="font-semibold text-amber-900">
                  Уважно ознайомтеся з правилами
                </p>

                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                  Після підтвердження ознайомлення буде
                  створено сесію тестування та розпочнеться
                  виконання тесту.
                </p>
              </div>
            </div>
          </div>

          {/* Інструкція */}
          <div className="mt-8 space-y-6 text-gray-700 leading-relaxed">
            <p className="font-semibold text-gray-900 text-lg">
              Шановний учасник / учасниця тренувального
              тестування!
            </p>

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
              залишити їх або зарядні пристрої,
              смартгодинники, навушники в спеціально
              відведеному місці — пропонуємо зробити це
              зараз. У разі виникнення технічних збоїв у
              роботі сервісу або погіршення самопочуття
              потрібно негайно повідомити про це інструктора.
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
              будь-якого предмета. Повернутися до виконання
              завдань одного із цих предметів і надати та
              зберегти відповіді можна протягом усього часу,
              відведеного на виконання завдань етапу
              тестування. Переходячи від одного предмета до
              іншого, уважно читайте спливні повідомлення.
              Для зарахування відповіді на завдання
              обов’язково потрібно натиснути на кнопку
              «Зберегти відповідь». Для виправлення відповіді
              виберіть інший варіант та повторно натисніть на
              кнопку «Зберегти відповідь» — у такому разі буде
              зараховано останню збережену вами відповідь.
              На боковій панелі, розташованій справа,
              відображатиметься інформація про опрацьовані
              вами завдання.
            </p>

            <p>
              Стежте за вказівками, які з’являються на
              моніторі комп’ютера, а також читайте інформацію
              у спливних повідомленнях.
            </p>

            <p>
              Якщо ви дочасно закінчите роботу над завданнями
              — можете завершити тестування, натиснувши кнопку
              «Завершити роботу над тестом».
            </p>

            <p>
              Будьте уважні: перед завершенням роботи система
              повідомить, на які завдання ви не надали або не
              зберегли відповіді.
            </p>

            <p>
              Після завершення виконання завдань тестування
              на екрані відобразиться інформація про збережені
              вами відповіді та набрані тестові бали.
            </p>

            <p>
              Якщо вам потрібна допомога у вирішенні питань,
              які не стосуються змісту завдань тесту,
              піднесіть руку, і до вас підійде старший
              інструктор.
            </p>

            <p className="pt-2 text-center text-lg font-semibold text-[#7A1F2B]">
              Зичимо успіхів!
            </p>
          </div>

          {/* Помилка */}
          {error && (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              {error}
            </div>
          )}

          {/* Підтвердження */}
          <div className="mt-10 border-t border-gray-200 pt-8">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={starting}
              className="w-full rounded-xl bg-[#7A1F2B] px-6 py-4 text-lg font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {starting
                ? "Підготовка тестування..."
                : "Ознайомлений / Ознайомлена з правилами проходження тестування"}
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-12 border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-8 text-center">
          <p className="font-medium text-gray-700">
            © Хорунжий Андрій Володимирович, 2026
          </p>

          <div className="flex items-center gap-2 text-gray-500">
            <Brain
              className="h-5 w-5 text-[#7A1F2B]"
              strokeWidth={2}
            />

            <span>
              Створено за підтримки технологій штучного
              інтелекту
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}