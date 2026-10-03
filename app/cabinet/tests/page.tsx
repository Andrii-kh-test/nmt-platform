import {
  ChevronRight,
  FileText,
} from "lucide-react";

const examSections = [
  {
    type: "НМТ",
    title: "НМТ",
    description:
      "Національний мультипредметний тест. Тренувальні тести з предметів НМТ.",
    href: "/cabinet/tests/nmt",
  },
  {
    type: "ЄВІ",
    title: "ЄВІ",
    description:
      "Єдиний вступний іспит. Тренувальні завдання для підготовки до іспиту.",
    href: "/cabinet/tests/evi",
  },
  {
    type: "ЄФВВ",
    title: "ЄФВВ",
    description:
      "Єдине фахове вступне випробування. Тренувальні тести для підготовки.",
    href: "/cabinet/tests/efvv",
  },
];

export default function CabinetTestsPage() {
  return (
    <div>
      {/* Заголовок */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-[#64152d]">
          Тести
        </h1>

        <p className="mt-3 text-lg text-gray-600">
          Оберіть формат тестування, щоб переглянути доступні тести.
        </p>
      </div>

      {/* Формати іспитів */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {examSections.map((exam) => (
          <a
            key={exam.type}
            href={exam.href}
            className="group block"
          >
            <div className="h-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-7 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#64152d]/10">
                  <FileText
                    className="h-7 w-7 text-[#64152d]"
                    strokeWidth={2}
                  />
                </div>

                <ChevronRight
                  className="h-6 w-6 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#64152d]"
                />
              </div>

              <h2 className="text-2xl font-bold text-[#64152d]">
                {exam.title}
              </h2>

              <p className="mt-3 leading-relaxed text-gray-600">
                {exam.description}
              </p>

              <div className="mt-6 font-semibold text-[#64152d]">
                Переглянути тести →
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}