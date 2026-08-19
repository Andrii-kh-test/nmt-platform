import { Suspense } from "react";

import AnalyticsClient from "./AnalyticsClient";

type PageProps = {
  searchParams: Promise<{
    testId?: string;
  }>;
};

export default async function AnalyticsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const testId = params.testId;

  if (!testId) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8">
          <h2 className="text-xl font-bold text-red-700">
            Не вдалося завантажити аналітику
          </h2>

          <p className="mt-2 text-red-600">
            Не вказано ID тесту.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2B]" />

            <p className="mt-5 text-lg text-gray-600">
              Завантаження аналітики...
            </p>
          </div>
        </div>
      }
    >
      <AnalyticsClient testId={testId} />
    </Suspense>
  );
}