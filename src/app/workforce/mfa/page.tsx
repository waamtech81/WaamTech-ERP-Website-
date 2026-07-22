import {
  WorkforceAuthShell,
  WorkforceMfaForm,
} from "@/components/workforce/auth-ui";

export default function WorkforceMfaPage() {
  return (
    <WorkforceAuthShell
      title="Security verification"
      description="Complete the verification required by your organization."
    >
      <WorkforceMfaForm />
    </WorkforceAuthShell>
  );
}
