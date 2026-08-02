import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";

import StartTestClient from "@/app/components/test/StartTestClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StartPage({
  params,
}: Props) {
  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!test) {
    notFound();
  }

  if (!test.isPublished) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">

          <h1 className="text-3xl font-bold text-[#7A1F2B] mb-4">
            Тест недоступний
          </h1>

          <p>
            Цей тест ще не опублікований.
          </p>

        </div>
      </main>
    );
  }

  return (
    <StartTestClient
      testId={test.id}
      title={test.title}
    />
  );
}