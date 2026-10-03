import Link from "next/link";

import { getCurrentUser } from "@/app/lib/auth/session";

export default async function CabinetPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="cabinet-dashboard">
      <section className="cabinet-welcome">
        <div className="cabinet-welcome-label">
          Особистий кабінет
        </div>

        <h1 className="cabinet-welcome-title">
          Вітаємо{" "}
          <span className="cabinet-welcome-name">
            {user.firstName}
          </span>
        </h1>
      </section>

      <section className="cabinet-hero">
        <div className="cabinet-hero-content">
          <h2 className="cabinet-hero-title">
            Готові до нового результату?
          </h2>

          <p className="cabinet-hero-text">
            Тут ви можете виконувати тести, переглядати
            результати та стежити за власним прогресом.
          </p>
        </div>
      </section>

      <section>
        <h2 className="cabinet-section-title">
          Ваш кабінет
        </h2>

        <div className="cabinet-cards">
          <CabinetCard
            href="/cabinet/tests"
            icon="▣"
            title="Тести"
            description="Переглядайте доступні тести та продовжуйте незавершені спроби."
          />

          <CabinetCard
            href="/cabinet/results"
            icon="✓"
            title="Результати"
            description="Переглядайте історію виконаних тестів та отримані результати."
          />

          <CabinetCard
            href="/cabinet/analytics"
            icon="◒"
            title="Аналітика"
            description="Аналізуйте свої результати, прогрес і сильні та слабкі теми."
          />

          <CabinetCard
            href="/cabinet/plan"
            icon="◇"
            title="Мій тариф"
            description="Переглядайте поточний тариф та доступні вам можливості."
          />

          <CabinetCard
            href="/cabinet/balance"
            icon="₴"
            title="Баланс"
            description="Керуйте балансом та переглядайте історію операцій."
          />

          <CabinetCard
            href="/cabinet/profile"
            icon="♙"
            title="Профіль"
            description="Редагуйте особисті дані та налаштування свого профілю."
          />
        </div>
      </section>
    </div>
  );
}

function CabinetCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div className="cabinet-card">
        <div className="cabinet-card-icon">
          {icon}
        </div>

        <div className="cabinet-card-title">
          {title}
        </div>

        <div className="cabinet-card-description">
          {description}
        </div>
      </div>
    </Link>
  );
}