"use client";

import { saveTest } from "@/app/api/saveTest";
import { useTestConstructor } from "@/app/context/TestConstructorContext";

export default function TestSettings() {
  const { test, updateTest } = useTestConstructor();

  async function handleSave() {
    console.log("========== SAVE ==========");
    console.log(test);
    console.log("test.id =", test.id);

    try {
      const result = await saveTest(test);

      console.log("Відповідь сервера:", result);

      alert(
        test.id
          ? "Тест успішно оновлено!"
          : "Тест успішно створено!"
      );
    } catch (error) {
      console.error(error);

      alert("Помилка під час збереження тесту.");
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">

      <h2 className="text-2xl font-bold text-[#7A1F2B] mb-6">
        Параметри тесту
      </h2>

      <div className="space-y-5">

        <div>
          <label className="block font-medium mb-2">
            Назва тесту
          </label>

          <input
            type="text"
            value={test.title}
            onChange={(e) =>
              updateTest("title", e.target.value)
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            Предмет
          </label>

          <select
            value={test.subject}
            onChange={(e) =>
              updateTest("subject", e.target.value)
            }
            className="w-full border rounded-lg p-3"
          >
            <option value="Українська мова">
              Українська мова
            </option>

            <option value="Українська література">
              Українська література
            </option>

            <option value="Математика">
              Математика
            </option>

            <option value="Історія України">
              Історія України
            </option>

            <option value="Англійська мова">
              Англійська мова
            </option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">
            Опис тесту
          </label>

          <textarea
            rows={4}
            value={test.description}
            onChange={(e) =>
              updateTest("description", e.target.value)
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            Навчальний рік
          </label>

          <input
            type="text"
            value={test.schoolYear}
            onChange={(e) =>
              updateTest("schoolYear", e.target.value)
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

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
<hr className="my-6" />

<h3 className="text-xl font-bold text-[#7A1F2B]">
  Доступ до тесту
</h3>

<div className="space-y-5 mt-4">

  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={test.isPublished}
      onChange={(e) =>
        updateTest("isPublished", e.target.checked)
      }
    />

    <span>Опублікувати тест</span>
  </label>

  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={test.codeRequired}
      onChange={(e) =>
        updateTest("codeRequired", e.target.checked)
      }
    />

    <span>Вимагати код доступу</span>
  </label>

  {test.codeRequired && (
    <>

      <div>

        <label className="block font-medium mb-2">
          Код доступу
        </label>

        <input
          type="text"
          value={test.accessCode}
          onChange={(e) =>
            updateTest("accessCode", e.target.value)
          }
          className="w-full border rounded-lg p-3 font-mono"
        />

      </div>

      <div className="flex gap-3">

        <button
          type="button"
          onClick={() => {

            const chars =
              "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

            let code = "NMT-";

            for (let i = 0; i < 6; i++) {
              code +=
                chars[
                  Math.floor(
                    Math.random() * chars.length
                  )
                ];
            }

            updateTest(
              "accessCode",
              code
            );

          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          🎲 Згенерувати
        </button>

        <button
          type="button"
          onClick={() =>
            navigator.clipboard.writeText(
              test.accessCode
            )
          }
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          📋 Копіювати
        </button>

      </div>

    </>
  )}

</div>
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