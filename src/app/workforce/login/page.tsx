import {
  WorkforceAuthShell,
  WorkforceLoginForm,
} from "@/components/workforce/auth-ui";

export default function WorkforceLoginPage() {
  return (
    <WorkforceAuthShell
      title="Welcome back"
      description="Sign in through the dedicated Workforce identity boundary."
    >
      <WorkforceLoginForm />
    </WorkforceAuthShell>
  );
}
