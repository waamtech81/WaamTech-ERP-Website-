export type PasswordStrengthRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_STRENGTH_RULES: PasswordStrengthRule[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /\d/.test(v) },
  {
    id: "special",
    label: "One special character (!@#$…)",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export function evaluatePasswordStrength(password: string) {
  const checks = PASSWORD_STRENGTH_RULES.map((r) => ({
    ...r,
    ok: r.test(password),
  }));
  return {
    checks,
    strong: checks.every((c) => c.ok),
  };
}

export function isPasswordStrong(password: string): boolean {
  return evaluatePasswordStrength(password).strong;
}
