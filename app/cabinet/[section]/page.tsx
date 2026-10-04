import { notFound } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/session";

import ProfileClient from "../profile/ProfileClient";

const sections: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  tests: {
    title: "Тести",
    description:
      "Тут будуть доступні для вас тести, незавершені спроби та тести, які ви можете придбати.",
  },

  results: {
    title: "Результати",
    description:
      "Тут буде історія виконаних тестів та детальна інформація про результати.",
  },

  analytics: {
    title: "Аналітика",
    description:
      "Тут буде статистика ваших результатів, динаміка прогресу та аналіз виконання завдань.",
  },

  plan: {
    title: "Мій тариф",
    description:
      "Тут буде інформація про ваш поточний тариф і доступні можливості.",
  },

  balance: {
    title: "Баланс",
    description:
      "Тут буде ваш баланс, поповнення та історія фінансових операцій.",
  },

  profile: {
    title: "Профіль",
    description:
      "Тут можна буде редагувати особисті дані, пароль та аватар.",
  },
};

export default async function CabinetSectionPage({
  params,
}: {
  params: Promise<{
    section: string;
  }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { section } = await params;

  const currentSection = sections[section];

  if (!currentSection) {
    notFound();
  }

  if (section === "profile") {
    return (
      <ProfileClient
  firstName={user.firstName}
  lastName={user.lastName}
  middleName={user.middleName}
  email={user.email}
  avatarUrl={user.avatarUrl}
/>
    );
  }

  return (
    <div className="cabinet-dashboard">
      <section className="cabinet-welcome">
        <div className="cabinet-welcome-label">
          Кабінет учасника
        </div>

        <h1 className="cabinet-welcome-title">
          {currentSection.title}
        </h1>
      </section>

      <section className="cabinet-hero">
        <div className="cabinet-hero-content">
          <h2 className="cabinet-hero-title">
            {currentSection.title}
          </h2>

          <p className="cabinet-hero-text">
            {currentSection.description}
          </p>
        </div>
      </section>
    </div>
  );
}