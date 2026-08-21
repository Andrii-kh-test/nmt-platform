import Link from "next/link";

const cards = [
  {
    title: "Предмети",
    description: "Керування предметами",
    href: "/admin/subjects",
    icon: "📖",
  },
  {
    title: "Тести",
    description: "Створення та редагування тестів",
    href: "/admin/tests",
    icon: "📚",
  },
  {
    title: "Питання",
    description: "Банк тестових завдань",
    href: "/admin/questions",
    icon: "❓",
  },
  {
    title: "Користувачі",
    description: "Зареєстровані користувачі",
    href: "/admin/users",
    icon: "👥",
  },
{ 
  title: "Результати", 
  description: "Перегляд результатів", 
  href: "/admin/results", 
  icon: "📊", 
}, 
{ 
  title: "Аналітика", 
  description: "Статистика виконання тестів та аналіз завдань", 
  href: "/admin/analytics", 
  icon: "📈", 
}, 
{ 
  title: "Налаштування", 
  description: "Параметри системи", 
  href: "/admin/settings", 
  icon: "⚙️", 
},
];

export default function AdminPage() {
  return (
    <>
      <div className="mb-10">
        <h2 className="text-4xl font-bold text-[#7A1F2B]">
          Панель керування
        </h2>

        <p className="mt-2 text-lg text-gray-600">
          Оберіть потрібний розділ для роботи з платформою.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="
              group
              rounded-xl
              border
              border-gray-200
              bg-white
              p-8
              shadow-sm
              transition
              hover:-translate-y-1
              hover:border-[#7A1F2B]
              hover:shadow-lg
            "
          >
            <div className="mb-6 text-5xl">
              {card.icon}
            </div>

            <h3 className="text-2xl font-bold text-[#7A1F2B]">
              {card.title}
            </h3>

            <p className="mt-3 text-gray-600">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}