import { prisma } from "@/app/lib/prisma";

import TestsPageClient from "@/app/components/admin/TestsPageClient";
export const dynamic = "force-dynamic";
export default async function TestsPage() {

  const tests = await prisma.test.findMany({

    include: {

      questions: true,

    },

    orderBy: {

      subject: "asc",

    },

  });

  return (

    <TestsPageClient tests={tests} />

  );

}