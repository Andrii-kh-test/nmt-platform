import AnalyticsClient from "../AnalyticsClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    testId: string;
  }>;
};

export default async function AnalyticsTestPage({
  params,
}: Props) {
  const { testId } = await params;

  return (
    <AnalyticsClient testId={testId} />
  );
}