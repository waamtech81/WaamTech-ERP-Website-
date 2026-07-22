import { ShieldX } from "lucide-react";
import { WorkforceStatusCard } from "@/components/workforce/auth-ui";

export default function WorkforceUnauthorizedPage() {
  return (
    <WorkforceStatusCard
      icon={<ShieldX className="h-6 w-6" aria-hidden="true" />}
      title="Authorization failed"
      description="The secure sign-in response could not be validated. No Workforce session was created."
    />
  );
}
