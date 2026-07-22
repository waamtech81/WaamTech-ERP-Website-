import { Clock3 } from "lucide-react";
import { WorkforceStatusCard } from "@/components/workforce/auth-ui";

export default function WorkforceSessionExpiredPage() {
  return (
    <WorkforceStatusCard
      icon={<Clock3 className="h-6 w-6" aria-hidden="true" />}
      title="Session expired"
      description="Your Workforce session is no longer active. Sign in again to continue."
      actionLabel="Sign in again"
    />
  );
}
