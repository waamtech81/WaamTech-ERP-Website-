/**
 * Legacy pending-signup store (password encrypt/decrypt) — DISABLED.
 * Identity and OTP are owned exclusively by the License Engine.
 * Do not re-enable password forwarding through the Website.
 */

export type PendingSignup = {
  tokenHash: string;
  email: string;
  name: string;
  passwordEnc: string;
  phone?: string;
  company_name: string;
  country: string;
  profile_id: string;
  industry_id?: string;
  plan?: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
};

function disabled(): never {
  throw new Error(
    "Legacy Website verification store is disabled. Use License Engine OTP registration."
  );
}

export async function createPendingSignup(_input: {
  email: string;
  name: string;
  password: string;
  phone?: string;
  company_name: string;
  country: string;
  profile_id: string;
  industry_id?: string;
  plan?: string;
}): Promise<{ token: string; expiresAt: number }> {
  disabled();
}

export async function readPendingByToken(_token: string): Promise<PendingSignup | null> {
  return null;
}

export function decryptPendingPassword(_record: PendingSignup): string {
  disabled();
}

export async function deletePending(_tokenHash: string): Promise<void> {
  /* no-op */
}

export async function bumpAttempts(_record: PendingSignup): Promise<void> {
  /* no-op */
}
