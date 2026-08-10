/** Signup OTP verify — duplicate-submit guards and response classification. */

export function isCaptchaVerifyFailure(message: string): boolean {
  return /captcha verification failed|captcha expired|captcha verification required/i.test(
    message
  );
}

/** Upstream provision took longer than the BFF waited — Engine may still finish. */
export function isUpstreamVerifyTimeout(message: string): boolean {
  return /timed out|timeout|temporarily unavailable|could not reach license/i.test(
    message
  );
}

/** True when Engine reports the registration session is already finalized. */
export function isRegistrationAlreadyCompletedResponse(
  json: { message?: unknown; code?: unknown } | null | undefined,
  httpStatus?: number
): boolean {
  const msg = String(json?.message || "").trim();
  const lower = msg.toLowerCase();
  if (
    /already been completed|registration has already been completed|already completed|welcome back|account is ready/i.test(
      lower
    )
  ) {
    return true;
  }
  if (httpStatus === 409 && /completed|conflict/i.test(lower)) {
    return true;
  }
  return false;
}

/** Synchronous guard — blocks parallel OTP verify submits. */
export function canStartOtpVerifySubmit(
  inFlight: boolean,
  completed: boolean
): boolean {
  return !inFlight && !completed;
}

/** Retry Siteverify once with a fresh token only for genuine captcha failures. */
export function shouldRetryCaptchaAfterVerifyFailure(
  json: { message?: unknown } | null | undefined,
  httpStatus?: number
): boolean {
  const message = String(json?.message || "");
  if (isRegistrationAlreadyCompletedResponse(json, httpStatus)) {
    return false;
  }
  return isCaptchaVerifyFailure(message);
}

/**
 * After captcha/timeout failures, recover UI if Engine already finished provisioning
 * instead of asking the user to click Verify again (which used to create a 2nd invoice).
 */
export function shouldRecoverCompletedRegistrationAfterFailure(
  json: { message?: unknown; success?: unknown } | null | undefined,
  httpStatus?: number
): boolean {
  if (json?.success === true) return false;
  if (isRegistrationAlreadyCompletedResponse(json, httpStatus)) return false;
  const message = String(json?.message || "");
  return (
    isCaptchaVerifyFailure(message) || isUpstreamVerifyTimeout(message)
  );
}
