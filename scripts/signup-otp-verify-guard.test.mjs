/**
 * Focused unit tests for signup OTP duplicate-submit guards.
 * Run: node scripts/signup-otp-verify-guard.test.mjs
 */
import assert from "node:assert/strict";
import {
  canStartOtpVerifySubmit,
  isCaptchaVerifyFailure,
  isRegistrationAlreadyCompletedResponse,
  isUpstreamVerifyTimeout,
  shouldRecoverCompletedRegistrationAfterFailure,
  shouldRetryCaptchaAfterVerifyFailure,
} from "../src/lib/signup/otp-verify-submit.ts";

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`fail - ${name}`);
    throw err;
  }
}

test("canStartOtpVerifySubmit blocks in-flight and completed", () => {
  assert.equal(canStartOtpVerifySubmit(false, false), true);
  assert.equal(canStartOtpVerifySubmit(true, false), false);
  assert.equal(canStartOtpVerifySubmit(false, true), false);
  assert.equal(canStartOtpVerifySubmit(true, true), false);
});

test("isCaptchaVerifyFailure matches genuine captcha errors", () => {
  assert.equal(isCaptchaVerifyFailure("CAPTCHA verification failed"), true);
  assert.equal(isCaptchaVerifyFailure("Captcha expired"), true);
  assert.equal(isCaptchaVerifyFailure("Invalid verification code."), false);
});

test("isUpstreamVerifyTimeout matches BFF abort messages", () => {
  assert.equal(isUpstreamVerifyTimeout("License service timed out."), true);
  assert.equal(isUpstreamVerifyTimeout("CAPTCHA verification failed"), false);
});

test("isRegistrationAlreadyCompletedResponse detects completed registration", () => {
  assert.equal(
    isRegistrationAlreadyCompletedResponse({
      message: "This registration has already been completed.",
    }),
    true
  );
  assert.equal(
    isRegistrationAlreadyCompletedResponse(
      { message: "Conflict" },
      409
    ),
    true
  );
  assert.equal(
    isRegistrationAlreadyCompletedResponse({
      message: "Invalid verification code.",
    }),
    false
  );
});

test("shouldRetryCaptchaAfterVerifyFailure preserves captcha retry without bypassing completion", () => {
  assert.equal(
    shouldRetryCaptchaAfterVerifyFailure(
      { message: "CAPTCHA verification failed" },
      400
    ),
    true
  );
  assert.equal(
    shouldRetryCaptchaAfterVerifyFailure(
      { message: "This registration has already been completed." },
      409
    ),
    false
  );
  assert.equal(
    shouldRetryCaptchaAfterVerifyFailure(
      { message: "Invalid verification code." },
      400
    ),
    false
  );
});

test("shouldRecoverCompletedRegistrationAfterFailure covers captcha and timeout races", () => {
  assert.equal(
    shouldRecoverCompletedRegistrationAfterFailure({
      success: false,
      message: "CAPTCHA verification failed",
    }),
    true
  );
  assert.equal(
    shouldRecoverCompletedRegistrationAfterFailure({
      success: false,
      message: "License service timed out.",
    }),
    true
  );
  assert.equal(
    shouldRecoverCompletedRegistrationAfterFailure({
      success: true,
      message: "OK",
    }),
    false
  );
});

console.log("signup-otp-verify-guard: all tests passed");
