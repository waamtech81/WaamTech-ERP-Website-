import { siteConfig } from "@/lib/data/site";

type SendResult = { sent: boolean; mode: "resend" | "console" | "none"; error?: string };

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

function siteBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    siteConfig.url ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export function buildVerifyUrl(token: string) {
  return `${siteBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

function verificationHtml(name: string, verifyUrl: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="background:#0b1f3a;padding:24px 28px;">
              <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">${siteConfig.name}</div>
              <div style="color:#93c5fd;font-size:13px;margin-top:4px;">${siteConfig.productLine} by ${siteConfig.companyName}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:22px;color:#0b1f3a;">Verify your email</h1>
              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
                Hi ${name || "there"}, thanks for creating a ${siteConfig.name} account.
                Please confirm this email address to activate your workspace and start your free trial.
              </p>
              <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:999px;">
                Verify email address
              </a>
              <p style="margin:20px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
                This link expires in 24 hours. If you did not sign up, you can ignore this email.
              </p>
              <p style="margin:16px 0 0;color:#94a3b8;font-size:11px;word-break:break-all;">
                ${verifyUrl}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function newsletterNotifyHtml(subscriberEmail: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="background:#0b1f3a;padding:24px 28px;">
              <div style="color:#ffffff;font-size:22px;font-weight:700;">${siteConfig.name}</div>
              <div style="color:#93c5fd;font-size:13px;margin-top:4px;">Newsletter subscription</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:20px;color:#0b1f3a;">New newsletter subscriber</h1>
              <p style="margin:0 0 8px;color:#475569;font-size:15px;line-height:1.6;">
                Someone subscribed to product updates from the website footer.
              </p>
              <p style="margin:0;color:#0b1f3a;font-size:16px;font-weight:600;">
                ${subscriberEmail}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    `${siteConfig.name} <noreply@${siteConfig.companyName.toLowerCase()}.com>`;
  const to = Array.isArray(input.to) ? input.to : [input.to];

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject: input.subject,
          html: input.html,
          text: input.text,
          ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return { sent: false, mode: "resend", error: errText || `Resend HTTP ${res.status}` };
      }
      return { sent: true, mode: "resend" };
    } catch (error) {
      return {
        sent: false,
        mode: "resend",
        error: error instanceof Error ? error.message : "Resend failed",
      };
    }
  }

  if (process.env.NODE_ENV !== "production" || process.env.ALLOW_CONSOLE_EMAIL === "1") {
    console.info(`[${siteConfig.name}] Email → ${to.join(", ")} | ${input.subject}`);
    console.info(input.text);
    return { sent: true, mode: "console" };
  }

  return {
    sent: false,
    mode: "none",
    error: "Email provider not configured. Set RESEND_API_KEY and EMAIL_FROM.",
  };
}

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  token: string;
}): Promise<SendResult> {
  const verifyUrl = buildVerifyUrl(opts.token);
  return sendEmail({
    to: opts.to,
    subject: `Verify your ${siteConfig.name} email`,
    html: verificationHtml(opts.name, verifyUrl),
    text: `Hi ${opts.name || "there"},\n\nVerify your ${siteConfig.name} email:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
}

const NEWSLETTER_INBOX =
  process.env.NEWSLETTER_INBOX || "newsletters@waamto.com";

export async function sendNewsletterSubscriptionNotice(opts: {
  subscriberEmail: string;
}): Promise<SendResult> {
  const email = opts.subscriberEmail.trim().toLowerCase();
  return sendEmail({
    to: NEWSLETTER_INBOX,
    replyTo: email,
    subject: `Newsletter signup: ${email}`,
    html: newsletterNotifyHtml(email),
    text: `New newsletter subscription\n\nEmail: ${email}\n\nSource: website footer`,
  });
}

const CONTACT_INBOX = process.env.CONTACT_INBOX || siteConfig.email;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function contactHtml(data: {
  name: string;
  email: string;
  company: string;
  phone: string;
  subject: string;
  message: string;
}) {
  const safe = {
    name: escapeHtml(data.name),
    email: escapeHtml(data.email),
    company: escapeHtml(data.company),
    phone: escapeHtml(data.phone),
    subject: escapeHtml(data.subject),
    message: escapeHtml(data.message),
  };
  const rows = [
    ["Name", safe.name],
    ["Email", safe.email],
    ["Company", safe.company],
    ["Phone", safe.phone],
    ["Subject", safe.subject],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:110px;">${label}</td><td style="padding:8px 0;color:#0b1f3a;font-size:14px;font-weight:600;">${value}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="background:#0b1f3a;padding:24px 28px;">
              <div style="color:#ffffff;font-size:22px;font-weight:700;">${siteConfig.name}</div>
              <div style="color:#93c5fd;font-size:13px;margin-top:4px;">Website contact form</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 16px;font-size:20px;color:#0b1f3a;">New contact message</h1>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
              <div style="margin-top:16px;padding:14px 16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <div style="color:#64748b;font-size:12px;margin-bottom:6px;">Message</div>
                <div style="color:#0b1f3a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${safe.message}</div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendContactFormMessage(opts: {
  name: string;
  email: string;
  company: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<SendResult> {
  const email = opts.email.trim().toLowerCase();
  return sendEmail({
    to: CONTACT_INBOX,
    replyTo: email,
    subject: `Contact: ${opts.subject} — ${opts.name}`,
    html: contactHtml(opts),
    text: [
      "New contact form message",
      "",
      `Name: ${opts.name}`,
      `Email: ${email}`,
      `Company: ${opts.company}`,
      `Phone: ${opts.phone}`,
      `Subject: ${opts.subject}`,
      "",
      opts.message,
    ].join("\n"),
  });
}
