import {
  Brain,
  ChevronRight,
  FileText,
  LockKeyhole,
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
      <div className="flex-1 max-w-7xl mx-auto px-8 py-12 w-full">

        {/* Заголовок */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-[#7A1F2B]">
            Платформа комп'ютерного тестування
          </h1>

          <p className="mt-6 text-xl text-gray-600">
            Обирайте іспит для тренування
          </p>
        </div>

        {/* Розділи іспитів */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {examSections.map((exam) => (
            <a
              key={exam.type}
              href={exam.href}
              className="group"
            >
              <div className="h-full bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-8">

                {/* Іконка */}
                <div className="flex items-center justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#7A1F2B]/10 flex items-center justify-center">
                    <FileText
                      className="w-8 h-8 text-[#7A1F2B]"
                      strokeWidth={2}
                    />
                  </div>

                  <ChevronRight
                    className="w-7 h-7 text-gray-300 group-hover:text-[#7A1F2B] group-hover:translate-x-1 transition-all"
                  />
                </div>

                {/* Назва */}
                <h2 className="text-3xl font-bold text-[#7A1F2B]">
                  {exam.title}
                </h2>

                {/* Опис */}
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {exam.description}
                </p>

                {/* Посилання */}
                <div className="mt-8 text-[#7A1F2B] font-semibold">
                  Переглянути тести →
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* =====================================================
            ВХІД АДМІНІСТРАТОРА
        ===================================================== */}

        <div className="mt-14 flex justify-center">
          <a
            href="/admin/login"
            className="
              group
              inline-flex
              items-center
              gap-3
              rounded-xl
              border
              border-[#7A1F2B]/30
              bg-white
              px-6
              py-3
              text-sm
              font-semibold
              text-[#7A1F2B]
              shadow-sm
              transition-all
              duration-200
              hover:border-[#7A1F2B]
              hover:bg-[#F3E8EA]
              hover:shadow-md
            "
          >
            <span
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-[#F3E8EA]
                transition-colors
                group-hover:bg-[#7A1F2B]
              "
            >
              <LockKeyhole
                className="
                  h-4
                  w-4
                  text-[#7A1F2B]
                  transition-colors
                  group-hover:text-white
                "
                strokeWidth={2}
              />
            </span>

            <span>
              Увійти як адміністратор
            </span>

            <ChevronRight
              className="
                h-4
                w-4
                text-gray-400
                transition-all
                group-hover:translate-x-1
                group-hover:text-[#7A1F2B]
              "
            />
          </a>
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 text-center">

          <p className="text-gray-700 font-medium">
            © Хорунжий Андрій Володимирович, 2026
          </p>

          <div className="flex items-center gap-2 text-gray-500">
            <Brain
              className="w-5 h-5 text-[#7A1F2B]"
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