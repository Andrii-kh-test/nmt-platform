import {
  Brain,
  ChevronRight,
  FileText,
  Circle,
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
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-[#7A1F2B]">
            Платформа комп'ютерного тестування
          </h1>

          <p className="mt-6 text-xl text-gray-600">
            Обирайте іспит для тренування
          </p>
        </div>

        {/* Основні іспити */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {examSections.map((exam) => (
            <a
              key={exam.type}
              href={exam.href}
              className="group"
            >
              <div className="h-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7A1F2B]/10">
                    <FileText
                      className="h-8 w-8 text-[#7A1F2B]"
                      strokeWidth={2}
                    />
                  </div>

                  <ChevronRight
                    className="h-7 w-7 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-[#7A1F2B]"
                  />
                </div>

                <h2 className="text-3xl font-bold text-[#7A1F2B]">
                  {exam.title}
                </h2>

                <p className="mt-4 leading-relaxed text-gray-600">
                  {exam.description}
                </p>

                <div className="mt-8 font-semibold text-[#7A1F2B]">
                  Переглянути тести →
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Комбіновані тести */}
        <div className="mt-8">
          <a
            href="/complex-tests"
            className="group block"
          >
            <div className="relative min-h-[230px] overflow-hidden rounded-2xl border border-[#7A1F2B]/20 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
              {/* Декоративні круги */}
              <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[2px] border-[#7A1F2B]/10" />

              <div className="pointer-events-none absolute -right-8 -top-12 h-52 w-52 rounded-full border-[2px] border-[#7A1F2B]/15" />

              <div className="pointer-events-none absolute right-8 top-0 h-40 w-40 rounded-full border-[2px] border-[#7A1F2B]/20" />

              <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full border-[2px] border-[#7A1F2B]/10" />

              <div className="pointer-events-none absolute -bottom-10 left-8 h-36 w-36 rounded-full border-[2px] border-[#7A1F2B]/15" />

              {/* Напівпрозоре центральне коло */}
              <div className="pointer-events-none absolute right-24 top-10 h-28 w-28 rounded-full bg-[#7A1F2B]/5" />

              {/* Вміст */}
              <div className="relative z-10 flex min-h-[230px] items-center justify-between gap-8 p-8 md:p-10">
                <div className="max-w-3xl">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7A1F2B] shadow-md">
                      <Circle
                        className="h-7 w-7 text-white"
                        strokeWidth={2}
                      />
                    </div>

                    <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#7A1F2B]">
                      Комплексне тестування
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-[#7A1F2B]">
                    Комбіновані тести
                  </h2>

                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
                    Один тест — кілька предметів. Обирайте комплексне
                    тестування для НМТ, ЄВІ або ЄФВВ.
                  </p>

                  <div className="mt-7 font-semibold text-[#7A1F2B]">
                    Переглянути комбіновані тести →
                  </div>
                </div>

                {/* Велика декоративна композиція справа */}
                <div className="relative hidden h-36 w-36 shrink-0 md:block">
                  <div className="absolute inset-0 rounded-full border-[3px] border-[#7A1F2B]/10" />

                  <div className="absolute inset-4 rounded-full border-[3px] border-[#7A1F2B]/20" />

                  <div className="absolute inset-8 rounded-full border-[3px] border-[#7A1F2B]/30" />

                  <div className="absolute inset-[52px] rounded-full bg-[#7A1F2B]" />

                  <div className="absolute left-1/2 top-1/2 h-20 w-1 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#7A1F2B]/10" />

                  <div className="absolute left-1/2 top-1/2 h-20 w-1 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#7A1F2B]/10" />
                </div>

                <ChevronRight
                  className="relative z-10 h-8 w-8 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#7A1F2B]"
                />
              </div>
            </div>
          </a>
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
              Створено за підтримки технологій штучного інтелекту
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}