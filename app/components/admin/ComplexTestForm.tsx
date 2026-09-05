"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";

type Test = {
  id: number;
  title: string;
  subject: string;
  duration: number;
};

type ComplexTestFormProps = {
  complexTestId?: number;
};

const CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateAccessCode(): string {
  function randomPart(length: number) {
    let result = "";

    for (let i = 0; i < length; i++) {
      const index = Math.floor(
        Math.random() * CODE_CHARACTERS.length
      );

      result += CODE_CHARACTERS[index];
    }

    return result;
  }

  return `NMT-${randomPart(4)}-${randomPart(4)}`;
}

export default function ComplexTestForm({
  complexTestId,
}: ComplexTestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");

  const [examType, setExamType] = useState("НМТ");
  const [section, setSection] = useState("");

  const [codeRequired, setCodeRequired] = useState(true);
  const [accessCode, setAccessCode] = useState("");

  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isEditMode = Boolean(complexTestId);

  useEffect(() => {
    loadTests();

    if (complexTestId) {
      loadComplexTest(complexTestId);
    } else {
      setLoading(false);
    }
  }, [complexTestId]);

  async function loadTests() {
    try {
      const response = await fetch("/api/admin/tests");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? "Не вдалося завантажити тести."
        );
      }

      const loadedTests = Array.isArray(data)
        ? data
        : data.tests ?? [];

      setTests(loadedTests);
    } catch (error) {
      console.error(
        "Помилка завантаження тестів:",
        error
      );

      alert(
        "Не вдалося завантажити список тестів."
      );
    }
  }

  async function loadComplexTest(id: number) {
    try {
      const response = await fetch(
        `/api/admin/complex-tests/${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ??
            "Не вдалося завантажити комбінований тест."
        );
      }

      const complexTest = data.complexTest;

      setTitle(complexTest.title ?? "");
      setDescription(complexTest.description ?? "");
      setDuration(String(complexTest.duration ?? 60));

      setExamType(
        complexTest.examType ?? "НМТ"
      );

      setSection(
        complexTest.section ?? ""
      );

      setCodeRequired(
        complexTest.codeRequired ?? true
      );

      setAccessCode(
        complexTest.accessCode ?? ""
      );

      setSelectedTestIds(
        (complexTest.tests ?? [])
          .sort(
            (a: { order: number }, b: { order: number }) =>
              a.order - b.order
          )
          .map(
            (item: { test: { id: number } }) =>
              item.test.id
          )
      );
    } catch (error) {
      console.error(
        "Помилка завантаження комбінованого тесту:",
        error
      );

      alert(
        "Не вдалося завантажити комбінований тест."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleTest(testId: number) {
    setSelectedTestIds((current) => {
      if (current.includes(testId)) {
        return current.filter((id) => id !== testId);
      }

      return [...current, testId];
    });
  }

  function generateNewCode() {
    setAccessCode(generateAccessCode());
  }

  function selectAllTests() {
    setSelectedTestIds(
      tests.map((test) => test.id)
    );
  }

  function clearSelectedTests() {
    setSelectedTestIds([]);
  }

  async function saveComplexTest() {
    if (!title.trim()) {
      alert("Введіть назву комбінованого тесту.");
      return;
    }

    if (!examType.trim()) {
      alert("Оберіть тип іспиту.");
      return;
    }

    if (!section.trim()) {
      alert("Введіть розділ комбінованого тесту.");
      return;
    }

    const parsedDuration = Number(duration);

    if (
      !Number.isInteger(parsedDuration) ||
      parsedDuration <= 0
    ) {
      alert(
        "Тривалість повинна бути додатним цілим числом."
      );
      return;
    }

    if (selectedTestIds.length < 2) {
      alert(
        "Для комбінованого тесту потрібно вибрати щонайменше два тести."
      );
      return;
    }

    if (
      codeRequired &&
      !accessCode.trim()
    ) {
      alert(
        "Введіть код доступу або згенеруйте його автоматично."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        description:
          description.trim() || null,
        duration: parsedDuration,
        examType: examType.trim(),
        section: section.trim(),
        codeRequired,
        accessCode: codeRequired
          ? accessCode.trim()
          : null,
        testIds: selectedTestIds,
      };

      const url = complexTestId
        ? `/api/admin/complex-tests/${complexTestId}`
        : "/api/admin/complex-tests";

      const method = complexTestId
        ? "PATCH"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ??
            "Не вдалося зберегти комбінований тест."
        );
        return;
      }

      window.location.href = "/admin/tests";
    } catch (error) {
      console.error(
        "Помилка збереження комбінованого тесту:",
        error
      );

      alert(
        "Сталася помилка під час збереження."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <p className="text-gray-500">
              Завантаження...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">

        {/* Заголовок */}
        <div className="flex items-center justify-between gap-4 mb-8">

          <div>
            <h1 className="text-4xl font-bold text-[#7A1F2B]">
              {isEditMode
                ? "Редагування комбінованого тесту"
                : "Створення комбінованого тесту"}
            </h1>

            <p className="text-gray-500 mt-2">
              Об'єднайте два або більше готових тестів
              в одну тестову сесію.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/admin/tests";
            }}
            className="
              inline-flex
              items-center
              gap-2
              px-5
              py-3
              rounded-lg
              border
              border-gray-300
              text-gray-700
              hover:border-[#7A1F2B]
              hover:text-[#7A1F2B]
              transition
              font-medium
              whitespace-nowrap
            "
          >
            <ArrowLeft className="w-5 h-5" />
            Назад
          </button>

        </div>

        <div className="grid grid-cols-12 gap-8">

          {/* Ліва колонка */}
          <div className="col-span-12 lg:col-span-4">

            <div className="bg-white rounded-xl shadow-lg p-6">

              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Налаштування
              </h2>

              {/* Тип іспиту */}
              <div className="mb-5">

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Тип іспиту
                </label>

                <select
                  value={examType}
                  onChange={(event) =>
                    setExamType(event.target.value)
                  }
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-lg
                    px-4
                    py-3
                    outline-none
                    bg-white
                    focus:border-[#7A1F2B]
                    focus:ring-1
                    focus:ring-[#7A1F2B]
                  "
                >
                  <option value="НМТ">НМТ</option>
                  <option value="ЄВІ">ЄВІ</option>
                  <option value="ЄФВВ">ЄФВВ</option>
                </select>

                <p className="text-xs text-gray-400 mt-2">
                  Визначає, у якому розділі іспитів учасник
                  побачить цей комбінований тест.
                </p>

              </div>

              {/* Розділ */}
              <div className="mb-5">

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Розділ комбінованих тестів
                </label>

                <input
                  type="text"
                  value={section}
                  onChange={(event) =>
                    setSection(event.target.value)
                  }
                  placeholder="Наприклад: Українська мова + історія України"
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-lg
                    px-4
                    py-3
                    outline-none
                    focus:border-[#7A1F2B]
                    focus:ring-1
                    focus:ring-[#7A1F2B]
                  "
                />

                <p className="text-xs text-gray-400 mt-2">
                  Саме за цим розділом комбінований тест
                  буде згрупований на сторінці учасника.
                </p>

              </div>

              {/* Назва */}
              <div className="mb-5">

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Назва комбінованого тесту
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Наприклад: НМТ — комплексний тест"
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-lg
                    px-4
                    py-3
                    outline-none
                    focus:border-[#7A1F2B]
                    focus:ring-1
                    focus:ring-[#7A1F2B]
                  "
                />

              </div>

              {/* Опис */}
              <div className="mb-5">

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Опис
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Короткий опис комбінованого тесту..."
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-lg
                    px-4
                    py-3
                    outline-none
                    resize-none
                    focus:border-[#7A1F2B]
                    focus:ring-1
                    focus:ring-[#7A1F2B]
                  "
                />

              </div>

              {/* Тривалість */}
              <div className="mb-6">

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Загальна тривалість, хвилин
                </label>

                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(event) =>
                    setDuration(
                      event.target.value
                    )
                  }
                  className="
                    w-full
                    border
                    border-gray-300
                    rounded-lg
                    px-4
                    py-3
                    outline-none
                    focus:border-[#7A1F2B]
                    focus:ring-1
                    focus:ring-[#7A1F2B]
                  "
                />

                <p className="text-xs text-gray-400 mt-2">
                  Це спільний час для всього комбінованого тесту.
                </p>

              </div>

              {/* Код доступу */}
              <div className="border-t border-gray-200 pt-6">

                <div className="flex items-center justify-between gap-3">

                  <div>
                    <p className="font-semibold text-gray-700">
                      Потрібен код доступу
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Учасник вводитиме код перед початком тестування.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCodeRequired(
                        (current) => !current
                      )
                    }
                    className={`
                      relative
                      inline-flex
                      h-6
                      w-11
                      flex-shrink-0
                      rounded-full
                      transition
                      ${
                        codeRequired
                          ? "bg-[#7A1F2B]"
                          : "bg-gray-300"
                      }
                    `}
                    aria-label="Потрібен код доступу"
                  >
                    <span
                      className={`
                        inline-block
                        h-5
                        w-5
                        transform
                        rounded-full
                        bg-white
                        shadow
                        transition
                        mt-0.5
                        ${
                          codeRequired
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        }
                      `}
                    />
                  </button>

                </div>

                {codeRequired && (
                  <div className="mt-4">

                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Код доступу
                    </label>

                    <div className="flex gap-2">

                      <input
                        type="text"
                        value={accessCode}
                        onChange={(event) =>
                          setAccessCode(
                            event.target.value.toUpperCase()
                          )
                        }
                        placeholder="NMT-7K4P-92QX"
                        className="
                          flex-1
                          min-w-0
                          border
                          border-gray-300
                          rounded-lg
                          px-4
                          py-3
                          outline-none
                          font-mono
                          uppercase
                          focus:border-[#7A1F2B]
                          focus:ring-1
                          focus:ring-[#7A1F2B]
                        "
                      />

                      <button
                        type="button"
                        onClick={generateNewCode}
                        title="Згенерувати новий код"
                        className="
                          inline-flex
                          items-center
                          justify-center
                          w-12
                          rounded-lg
                          border
                          border-gray-300
                          text-gray-600
                          hover:border-[#7A1F2B]
                          hover:text-[#7A1F2B]
                          transition
                        "
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>

                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Рекомендований формат: NMT-XXXX-XXXX.
                      Літери O, I та цифри 0, 1 не використовуються.
                    </p>

                  </div>
                )}

              </div>

              {/* Зберегти */}
              <button
                type="button"
                onClick={saveComplexTest}
                disabled={saving}
                className="
                  w-full
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  bg-[#7A1F2B]
                  hover:bg-[#651923]
                  disabled:bg-gray-400
                  text-white
                  px-5
                  py-3
                  rounded-lg
                  font-semibold
                  shadow
                  transition
                  mt-8
                "
              >
                <Save className="w-5 h-5" />

                {saving
                  ? "Збереження..."
                  : isEditMode
                    ? "Зберегти зміни"
                    : "Створити комбінований тест"}

              </button>

            </div>

          </div>

          {/* Права колонка */}
          <div className="col-span-12 lg:col-span-8">

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">

              <div className="px-6 py-5 border-b border-gray-200">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Тести у складі
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Виберіть тести, які мають увійти до комбінованого тесту.
                    </p>
                  </div>

                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={selectAllTests}
                      className="
                        px-3
                        py-2
                        rounded-lg
                        border
                        border-gray-300
                        text-sm
                        text-gray-700
                        hover:border-[#7A1F2B]
                        hover:text-[#7A1F2B]
                        transition
                      "
                    >
                      Вибрати всі
                    </button>

                    <button
                      type="button"
                      onClick={clearSelectedTests}
                      className="
                        px-3
                        py-2
                        rounded-lg
                        border
                        border-gray-300
                        text-sm
                        text-gray-700
                        hover:border-[#7A1F2B]
                        hover:text-[#7A1F2B]
                        transition
                      "
                    >
                      Очистити
                    </button>

                  </div>

                </div>

                <div className="mt-4">

                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#7A1F2B]/10 text-[#7A1F2B] text-sm font-semibold">
                    Вибрано: {selectedTestIds.length}
                  </span>

                </div>

              </div>

              {/* Список тестів */}
              {tests.length === 0 ? (

                <div className="p-10 text-center">

                  <p className="text-gray-500">
                    Доступних тестів немає.
                  </p>

                  <p className="text-sm text-gray-400 mt-2">
                    Спочатку створіть звичайні тести.
                  </p>

                </div>

              ) : (

                <div className="divide-y divide-gray-200">

                  {tests.map((test) => {

                    const selected =
                      selectedTestIds.includes(
                        test.id
                      );

                    return (
                      <label
                        key={test.id}
                        className={`
                          flex
                          items-center
                          gap-4
                          px-6
                          py-5
                          cursor-pointer
                          transition
                          ${
                            selected
                              ? "bg-[#7A1F2B]/5"
                              : "hover:bg-gray-50"
                          }
                        `}
                      >

                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleTest(test.id)
                          }
                          className="
                            w-5
                            h-5
                            accent-[#7A1F2B]
                            flex-shrink-0
                          "
                        />

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-semibold text-gray-800">
                              {test.title}
                            </h3>

                            <span className="
                              px-2
                              py-1
                              rounded-md
                              bg-slate-100
                              text-gray-600
                              text-xs
                              font-medium
                            ">
                              {test.subject}
                            </span>

                          </div>

                          <p className="text-sm text-gray-400 mt-1">
                            Власна тривалість: {test.duration} хв
                          </p>

                        </div>

                        {selected && (
                          <span className="
                            text-sm
                            font-semibold
                            text-[#7A1F2B]
                            whitespace-nowrap
                          ">
                            Додано
                          </span>
                        )}

                      </label>
                    );
                  })}

                </div>

              )}

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}