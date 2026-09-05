"use client";

import { useEffect, useState } from "react";

import { saveTest } from "@/app/api/saveTest";
import { useTestConstructor } from "@/app/context/TestConstructorContext";
import { generateAccessCode } from "@/app/utils/generateAccessCode";

type Subject = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

export default function TestSettings() {
  const { test, updateTest } = useTestConstructor();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] =
    useState(true);

  // ========================================
  // ЗАВАНТАЖЕННЯ РОЗДІЛІВ
  // ========================================

  useEffect(() => {
    async function loadSubjects() {
      try {
        const response = await fetch(
          "/api/admin/subjects"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Не вдалося завантажити розділи."
          );
        }

        setSubjects(result.subjects || []);
      } catch (error) {
        console.error(
          "LOAD SUBJECTS ERROR:",
          error
        );
      } finally {
        setSubjectsLoading(false);
      }
    }

    loadSubjects();
  }, []);

  // ========================================
  // АВТОМАТИЧНО ВИЗНАЧАЄМО subjectId
  // ДЛЯ ІСНУЮЧИХ ТЕСТІВ
  // ========================================

  useEffect(() => {
    if (
      subjects.length === 0 ||
      test.subjectId
    ) {
      return;
    }

    const currentSubject =
      subjects.find(
        (subject) =>
          subject.name === test.subject
      );

    if (currentSubject) {
      updateTest(
        "subjectId",
        currentSubject.id
      );
    }
  }, [
    subjects,
    test.subject,
    test.subjectId,
    updateTest,
  ]);

  // ========================================
  // ЗБЕРЕЖЕННЯ ТЕСТУ
  // ========================================

  async function handleSave() {
    console.log("========== SAVE ==========");
    console.log(test);

    // Перевірка номера розташування
    if (
      !Number.isInteger(test.displayOrder) ||
      test.displayOrder < 1
    ) {
      alert(
        "Вкажіть номер розташування тесту на головній сторінці."
      );

      return;
    }

    try {
      const result = await saveTest(test);

      console.log(result);

      alert(
        test.id
          ? "Тест успішно оновлено!"
          : "Тест успішно створено!"
      );
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "Помилка під час збереження тесту.";

      alert(message);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">

      <h2 className="text-2xl font-bold text-[#7A1F2B] mb-6">
        Параметри тесту
      </h2>

      <div className="space-y-5">

        {/* ==========================
            ТИП ІСПИТУ
        ========================== */}

        <div>
          <label className="block font-medium mb-2">
            Тип іспиту
          </label>

          <select
            value={test.examType}
            onChange={(e) =>
              updateTest(
                "examType",
                e.target.value as
                  | "НМТ"
                  | "ЄВІ"
                  | "ЄФВВ"
              )
            }
            className="w-full border rounded-lg p-3"
          >
            <option value="НМТ">
              НМТ
            </option>

            <option value="ЄВІ">
              ЄВІ
            </option>

            <option value="ЄФВВ">
              ЄФВВ
            </option>
          </select>
        </div>

        {/* ==========================
            НАЗВА
        ========================== */}

        <div>
          <label className="block font-medium mb-2">
            Назва тесту
          </label>

          <input
            type="text"
            value={test.title}
            onChange={(e) =>
              updateTest(
                "title",
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        {/* ==========================
            РОЗДІЛ
        ========================== */}

        <div>
          <label className="block font-medium mb-2">
            Розділ
          </label>

          <select
            value={test.subjectId ?? ""}
            onChange={(e) => {
              const subjectId =
                Number(e.target.value);

              const selectedSubject =
                subjects.find(
                  (subject) =>
                    subject.id === subjectId
                );

              if (!selectedSubject) {
                return;
              }

              updateTest(
                "subjectId",
                selectedSubject.id
              );

              updateTest(
                "subject",
                selectedSubject.name
              );
            }}
            disabled={subjectsLoading}
            className="w-full border rounded-lg p-3 disabled:bg-gray-100 disabled:text-gray-500"
          >
            {subjectsLoading ? (
              <option value="">
                Завантаження розділів...
              </option>
            ) : subjects.length === 0 ? (
              <option value="">
                Розділів ще немає
              </option>
            ) : (
              <>
                <option value="">
                  Оберіть розділ
                </option>

                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
              </>
            )}
          </select>

          <p className="text-sm text-gray-500 mt-2">
            Розділ визначає, у якій категорії
            тест відображатиметься в банку тестів.
          </p>
        </div>

        {/* ==========================
            ОПИС
        ========================== */}

        <div>
          <label className="block font-medium mb-2">
            Опис тесту
          </label>

          <textarea
            rows={4}
            value={test.description}
            onChange={(e) =>
              updateTest(
                "description",
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        {/* ==========================
            НАВЧАЛЬНИЙ РІК
        ========================== */}

        <div>
          <label className="block font-medium mb-2">
            Навчальний рік
          </label>

          <input
            type="text"
            value={test.schoolYear}
            onChange={(e) =>
              updateTest(
                "schoolYear",
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        {/* ==========================
            ТРИВАЛІСТЬ
        ========================== */}

        <div>
          <label className="block font-medium mb-2">
            Тривалість (хв)
          </label>

          <input
            type="number"
            min={1}
            value={test.duration}
            onChange={(e) =>
              updateTest(
                "duration",
                Number(e.target.value)
              )
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        {/* ==========================
            МАКСИМАЛЬНА КІЛЬКІСТЬ БАЛІВ
        ========================== */}

        <div>
          <label className="block font-medium mb-2">
            Максимальна кількість балів
          </label>

          <input
            type="number"
            min={1}
            value={test.maxPoints}
            onChange={(e) =>
              updateTest(
                "maxPoints",
                Number(e.target.value)
              )
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        {/* ==========================
            ПОРЯДОК НА ГОЛОВНІЙ
        ========================== */}

        <div>
          <label className="block font-medium mb-2">
            Порядок на головній сторінці
          </label>

          <input
            type="number"
            min={1}
            step={1}
            value={test.displayOrder || ""}
            onChange={(e) =>
              updateTest(
                "displayOrder",
                e.target.value === ""
                  ? 0
                  : Number(e.target.value)
              )
            }
            className="w-full border rounded-lg p-3"
            placeholder="Наприклад: 4"
          />

          <p className="text-sm text-gray-500 mt-2">
            Визначає порядок розташування
            опублікованого тесту на головній
            сторінці. Наприклад: 1 — перший,
            2 — другий, 3 — третій.
          </p>
        </div>

        <hr className="my-6" />

        {/* ==========================
            ДОСТУП ДО ТЕСТУ
        ========================== */}

        <h3 className="text-xl font-semibold text-[#7A1F2B]">
          Доступ до тесту
        </h3>

        {/* ПУБЛІКАЦІЯ */}

        <label className="flex items-center gap-3">

          <input
            type="checkbox"
            checked={test.isPublished}
            onChange={(e) =>
              updateTest(
                "isPublished",
                e.target.checked
              )
            }
            className="w-5 h-5"
          />

          <span>
            Опублікувати тест
          </span>

        </label>

        {/* КОД */}

        <label className="flex items-center gap-3">

          <input
            type="checkbox"
            checked={test.codeRequired}
            onChange={(e) =>
              updateTest(
                "codeRequired",
                e.target.checked
              )
            }
            className="w-5 h-5"
          />

          <span>
            Вимагати код доступу
          </span>

        </label>

        {/* ==========================
            КОД ДОСТУПУ
        ========================== */}

        {test.codeRequired && (
          <div>

            <label className="block font-medium mb-2">
              Код доступу
            </label>

            <div className="flex gap-3">

              <input
                type="text"
                value={test.accessCode}
                onChange={(e) =>
                  updateTest(
                    "accessCode",
                    e.target.value.toUpperCase()
                  )
                }
                className="flex-1 border rounded-lg p-3 font-mono text-lg tracking-wider"
                placeholder="Q7RM8X"
              />

              <button
                type="button"
                onClick={() =>
                  updateTest(
                    "accessCode",
                    generateAccessCode()
                  )
                }
                className="bg-[#7A1F2B] hover:bg-[#651923] text-white px-4 rounded-lg"
                title="Згенерувати випадковий код"
              >
                🔄
              </button>

            </div>

            <p className="text-sm text-gray-500 mt-2">
              Натисніть 🔄 для автоматичної
              генерації коду.
            </p>

          </div>
        )}

        {/* ==========================
            ЗБЕРЕЖЕННЯ
        ========================== */}

        <button
          type="button"
          onClick={handleSave}
          className="w-full bg-[#7A1F2B] hover:bg-[#651923] text-white rounded-lg py-3 font-semibold transition"
        >
          {test.id
            ? "💾 Зберегти зміни"
            : "➕ Створити тест"}
        </button>

      </div>
    </div>
  );
}