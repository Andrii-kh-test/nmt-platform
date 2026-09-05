import { prisma } from "@/app/lib/prisma";

import TestsPageClient from "@/app/components/admin/TestsPageClient";

export const dynamic = "force-dynamic";

export default async function TestsPage() {
  const [tests, subjects] = await Promise.all([
    prisma.test.findMany({
      where: {
        isArchived: false,
      },

      include: {
        questions: true,
        subjectRef: true,
      },

      orderBy: {
        subject: "asc",
      },
    }),

    prisma.subject.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },

      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <TestsPageClient
      tests={tests}
      subjects={subjects}
    />
  );
}