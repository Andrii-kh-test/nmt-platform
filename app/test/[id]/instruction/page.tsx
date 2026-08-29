"use client";

import {
  use,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  useTestSession,
} from "@/app/context/TestSessionContext";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function InstructionPage({
  params,
}: Props) {
  const { id } = use(params);

  const router =
    useRouter();

  const {
    stopTimer,
    setSessionId,
  } = useTestSession();

  const [
    accepted,
    setAccepted,
  ] = useState(false);

  const [
    starting,
    setStarting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  // =====================================================
  // INSTRUCTION PAGE
  // =====================================================

  useEffect(() => {
    /*
     * На сторінці інструкції
     * локальний countdown не працює.
     *
     * Офіційний час тестування
     * тут НЕ запускається.
     */

    stopTimer();
  }, [stopTimer]);

  // =====================================================
  // START TEST
  // =====================================================

  const handleStartTest =
    async () => {
      if (
        !accepted ||
        starting
      ) {
        return;
      }

      setStarting(true);
      setError(null);

      // =================================================
      // TEST ID
      // =================================================

      const testId =
        Number(id);

      if (
        !Number.isInteger(
          testId
        ) ||
        testId <= 0
      ) {
        setError(
          "Некоректний id тесту."
        );

        setStarting(false);

        return;
      }

      // =================================================
      // SESSION ID
      // =================================================

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
        Number(
          storedSessionId
        );

      if (
        !Number.isInteger(
          sessionId
        ) ||
        sessionId <= 0
      ) {
        setError(
          "Некоректний id сесії."
        );

        setStarting(false);

        return;
      }

      // =================================================
      // SYNCHRONIZE SESSION ID
      // =================================================

      setSessionId(
        sessionId
      );

      // =================================================
      // GO TO TEST
      // =================================================
      //
      // ВАЖЛИВО:
      //
      // Тут НЕ викликаємо:
      //
      // POST /api/test/begin
      //
      // Офіційний початок тесту
      // виконає SessionMonitor
      // вже на сторінці завдань.
      //
      // Саме тому час не починає
      // відраховуватися під час
      // перебування на сторінці інструкції.
      // =================================================

      console.log(
        "INSTRUCTION: GO TO TEST",
        {
          testId,
          sessionId,
        }
      );

      router.push(
        `/test/${testId}`
      );
    };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex justify-center py-10">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-lg border border-gray-200 p-10">

        <h1 className="text-4xl font-bold text-[#7A1F2B] mb-8">
          Інструкція щодо проходження тестування
        </h1>

        <div className="text-gray-700 leading-8 text-justify">

          <p className="text-center font-bold mb-6">
            Шановний учасник / учасниця тренувального тестування!
          </p>

          <p className="mb-4">
            Обов’язково ознайомтеся з правилами проходження тестування та
            правилами роботи із сервісом і натисніть на кнопку
            «Ознайомлений / Ознайомлена з правилами проходження тестування».
            Наголошуємо, що в разі порушення цих правил вас буде позбавлено
            права продовжувати роботу, а ваші результати буде анульовано.
          </p>

          <p className="mb-4">
            Зауважуємо: у ТЕЦ може бути здійснено контроль за дотриманням
            процедури проходження НМТ за допомогою металодетектора. Також у
            ТЕЦ здійснюється відеоспостереження.
          </p>

          <p className="mb-4">
            Якщо ви забули вимкнути мобільні телефони чи залишити їх або
            зарядні пристрої, смартгодинники, навушники в спеціально
            відведеному місці — пропонуємо зробити це зараз. У разі
            виникнення технічних збоїв у роботі сервісу або погіршення
            самопочуття потрібно негайно повідомити про це інструктора.
          </p>

          <p className="mb-4">
            Якщо ви вважатимете, що щодо вас допущено порушення процедури
            проведення НМТ, що може вплинути на ваш результат, — до виходу
            з тимчасового екзаменаційного центру (ТЕЦ) подайте відповідальному
            за ТЕЦ апеляційну заяву щодо порушення процедури.
          </p>

          <p className="mb-4">
            У випадку оголошення повітряної тривоги до початку допуску до ТЕЦ
            пройдіть в укриття за вказівниками та перебувайте там до
            повідомлення про її завершення. Якщо ж повітряну тривогу
            оголосять під час тестування — вас буде повідомлено про це,
            а роботу над тестом заблоковано.
          </p>

          <p className="mb-4">
            Якщо ви не зможете завершити виконання роботи через виникнення
            нестандартних ситуацій у ТЕЦ або через різке погіршення стану
            здоров’я, вам буде надано змогу пройти НМТ під час додаткових
            сесій відповідно до встановленого порядку.
          </p>

          <p className="mb-4">
            На виконання завдань з української мови відведено 60 хвилин.
            Для зарахування відповіді на завдання обов’язково потрібно
            натиснути на кнопку «Зберегти відповідь».
          </p>

          <p className="mb-4">
            На боковій панелі, розташованій праворуч, відображатиметься
            інформація про опрацювання вами завдань.
          </p>

          <p className="mb-4">
            Стежте за вказівками, які з’являються на моніторі комп’ютера,
            а також читайте інформацію у спливних повідомленнях.
          </p>

          <p className="mb-4">
            Якщо ви дочасно закінчите роботу над завданнями — можете
            завершити тестування, натиснувши кнопку
            «Завершити роботу над тестом».
          </p>

          <p className="mb-4">
            Будьте уважні: перед завершенням роботи система повідомить,
            на які завдання ви не надали або не зберегли відповіді.
          </p>

          <p className="mb-4">
            Після завершення виконання завдань тестування на екрані
            відобразиться інформація про збережені вами відповіді
            та набрані тестові бали.
          </p>

          <p className="mb-8">
            Якщо вам потрібна допомога у вирішенні питань, які не стосуються
            змісту завдань тесту, піднесіть руку, і до вас підійде старший
            інструктор.
          </p>

          <p className="text-center font-bold mb-8">
            Зичимо успіхів!
          </p>

        </div>

        {/* AGREEMENT */}

        <div className="mt-10 flex items-center gap-4">

          <input
            id="agree"
            type="checkbox"
            checked={accepted}
            onChange={(event) =>
              setAccepted(
                event.target.checked
              )
            }
            disabled={starting}
            className="w-5 h-5"
          />

          <label
            htmlFor="agree"
            className="text-lg cursor-pointer"
          >
            Ознайомлений / Ознайомлена з правилами проходження тестування
          </label>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {/* START */}

        <div className="mt-10 flex justify-end">

          <button
            type="button"
            disabled={
              !accepted ||
              starting
            }
            onClick={
              handleStartTest
            }
            className="
              px-8
              py-4
              rounded-xl
              text-white
              font-semibold
              transition
              disabled:bg-gray-400
              disabled:cursor-not-allowed
              bg-[#7A1F2B]
              hover:bg-[#641823]
            "
          >
            {starting
              ? "Починаємо тестування..."
              : "Розпочати тестування"}
          </button>

        </div>

      </div>
    </main>
  );
}