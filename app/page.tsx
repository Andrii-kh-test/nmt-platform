import {
  Brain,
  ChevronRight,
  FileText,
} from "lucide-react";

const examSections = [
  {
    type: "НМТ",
    title: "НМТ",
    description:
      "Національний мультипредметний тест. Тренувальні тести з предметів НМТ.",
    href: "/nmt",
  },
  {
    type: "ЄВІ",
    title: "ЄВІ",
    description:
      "Єдиний вступний іспит. Тренувальні завдання для підготовки до іспиту.",
    href: "/yevi",
  },
  {
    type: "ЄФВВ",
    title: "ЄФВВ",
    description:
      "Єдине фахове вступне випробування. Тренувальні тести для підготовки.",
    href: "/yefvv",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">

      {/* =====================================================
          ОСНОВНИЙ КОНТЕНТ
      ===================================================== */}

      <div className="flex-1 max-w-7xl mx-auto px-8 py-12 w-full">

        {/* =================================================
            ЗАГОЛОВОК
        ================================================= */}

        <div className="text-center mb-14">

          <h1 className="text-5xl font-bold text-[#7A1F2B]">
            Платформа комп'ютерного тестування
          </h1>

          <p className="mt-6 text-xl text-gray-600">
            Обирайте іспит для тренування
          </p>

        </div>

        {/* =================================================
            РОЗДІЛИ ІСПИТІВ
        ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {examSections.map((exam) => (
            <a
              key={exam.type}
              href={exam.href}
              className="group"
            >
              <div
                className="
                  h-full
                  rounded-2xl
                  border
                  border-gray-200
                  bg-white
                  p-8
                  shadow-sm
                  transition-all
                  duration-200
                  hover:-translate-y-1
                  hover:shadow-xl
                "
              >

                {/* Іконка */}

                <div className="mb-8 flex items-center justify-between">

                  <div
                    className="
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-2xl
                      bg-[#7A1F2B]/10
                    "
                  >
                    <FileText
                      className="h-8 w-8 text-[#7A1F2B]"
                      strokeWidth={2}
                    />
                  </div>

                  <ChevronRight
                    className="
                      h-7
                      w-7
                      text-gray-300
                      transition-all
                      group-hover:translate-x-1
                      group-hover:text-[#7A1F2B]
                    "
                  />

                </div>

                {/* Назва */}

                <h2 className="text-3xl font-bold text-[#7A1F2B]">
                  {exam.title}
                </h2>

                {/* Опис */}

                <p className="mt-4 leading-relaxed text-gray-600">
                  {exam.description}
                </p>

                {/* Посилання */}

                <div className="mt-8 font-semibold text-[#7A1F2B]">
                  Переглянути тести →
                </div>

              </div>
            </a>
          ))}

        </div>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="mt-12 border-t border-gray-200 bg-white py-8">

        <div
          className="
            mx-auto
            flex
            max-w-7xl
            flex-col
            items-center
            gap-3
            px-8
            text-center
          "
        >

          <p className="font-medium text-gray-700">
            © Хорунжий Андрій Володимирович, 2026
          </p>

          <div className="flex items-center gap-2 text-gray-500">

            <Brain
              className="h-5 w-5 text-[#7A1F2B]"
              strokeWidth={2}
            />

            <span>
              Створено за підтримки технологій штучного інтелекту
            </span>

          </div>

        </div>

      </footer>

    </main>
  );
}