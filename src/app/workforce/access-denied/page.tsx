import { Ban } from "lucide-react";
import { WorkforceStatusCard } from "@/components/workforce/auth-ui";

export default function WorkforceAccessDeniedPage() {
  return (
    <WorkforceStatusCard
      icon={<Ban className="h-6 w-6" aria-hidden="true" />}
      title="Access denied"
      description="Your account or organization policy does not permit access to this Control Center."
    />
  );
}
