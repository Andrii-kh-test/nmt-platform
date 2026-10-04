import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth/session";
import ParticipantAnalyticsClient from "./ParticipantAnalyticsClient";

type Props = {
  params: Promise<{
    resultId: string;
  }>;
};

export default async function ParticipantAnalyticsPage({
  params,
}: Props) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { resultId } = await params;

  const parsedResultId = Number(resultId);

  if (
    !Number.isInteger(parsedResultId) ||
    parsedResultId <= 0
  ) {
    redirect("/cabinet/analytics");
  }

  return (
    <ParticipantAnalyticsClient
      resultId={parsedResultId}
    />
  );
}