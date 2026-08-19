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

  const testId = params.testId ?? "";

  return (
    <AnalyticsClient testId={testId} />
  );
}