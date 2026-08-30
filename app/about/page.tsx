import Image from "next/image";
import {
  Brain,
} from "lucide-react";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden bg-[#F8FAFC]">

      {/* Декоративні кола */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[#7A1F2B]/5" />
      <div className="pointer-events-none absolute top-[45%] -left-40 h-96 w-96 rounded-full bg-[#7A1F2B]/5" />
      <div className="pointer-events-none absolute bottom-[-180px] right-[10%] h-96 w-96 rounded-full bg-[#7A1F2B]/5" />

      {/* =====================================================
          ОСНОВНИЙ КОНТЕНТ
      ===================================================== */}
      <div className="relative flex-1 px-6 py-16">

        <div className="mx-auto max-w-5xl">

          {/* ==================== ПРО ПЛАТФОРМУ ==================== */}
          <section>
            <h1 className="text-left text-4xl font-bold text-[#7A1F2B]">
              Про платформу
            </h1>

            <div className="mt-8 min-h-[270px] rounded-2xl bg-white p-8 shadow-sm md:p-10">
              <p className="text-justify text-lg leading-8 text-[#6B7280]">
                Платформа створена для системної підготовки до державних
                іспитів <strong>НМТ, ЄВІ, ЄФВВ</strong>.
              </p>

              <p className="mt-5 text-justify text-lg leading-8 text-[#6B7280]">
                Реалістичний формат тестування, контроль часу, зручна
                навігація та аналітика результатів допомагають не просто
                виконувати завдання, а бачити власний прогрес.
              </p>

              <p className="mt-7 text-center text-xl font-semibold text-[#7A1F2B]">
                Готуйся. Тестуйся. Аналізуй. Покращуй результат.
              </p>
            </div>
          </section>

          {/* ==================== ПРО АВТОРА ==================== */}
          <section className="mt-20">
            <h2 className="text-left text-3xl font-bold text-[#7A1F2B]">
              Про автора
            </h2>

            <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm md:p-10">
              <div className="flex flex-col gap-10 md:flex-row md:items-start">

                {/* Фото */}
                <div className="shrink-0 flex justify-center md:justify-start">
                  <Image
                    src="/images/author.jpg"
                    alt="Хорунжий Андрій Володимирович"
                    width={300}
                    height={375}
                    className="rounded-2xl object-cover shadow-md"
                  />
                </div>

                {/* Біографія */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[#1F2937]">
                    Хорунжий Андрій Володимирович
                  </h3>

                  <p className="mt-5 text-justify leading-7 text-[#4B5563]">
                    Учитель української мови та літератури Комунального
                    закладу «Харківський ліцей № 5 Харківської міської ради»,
                    методист Комунального закладу «Харківська обласна
                    Мала академія наук».
                  </p>

                  <p className="mt-4 text-justify leading-7 text-[#4B5563]">
                    Народився у м. Харкові. Закінчив Харківську
                    загальноосвітню школу № 139. У 2026 році завершив
                    навчання на філологічному факультеті Харківського
                    національного університету імені В. Н. Каразіна.
                  </p>

                  <p className="mt-4 text-justify leading-7 text-[#4B5563]">
                    До кола наукових інтересів входять історія української
                    мови, лінгвокогнітологія та лінгвонаратологія. Автор
                    понад 10 друкованих праць. Учасник міжнародних,
                    всеукраїнських та регіональних наукових конференцій
                    і семінарів.
                  </p>

                  {/* Контакти */}
                  <div className="mt-7 border-t border-gray-100 pt-5">
                    <h4 className="font-semibold text-[#1F2937]">
                      Контакти
                    </h4>

                    <p className="mt-2 text-[#6B7280]">
                      E-пошта:{" "}
                      <a
                        href="mailto:ahorunzij81@gmail.com"
                        className="text-[#7A1F2B] transition hover:underline"
                      >
                        ahorunzij81@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

        </div>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="border-t border-gray-200 bg-white py-8">

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