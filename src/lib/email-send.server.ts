import { EmailAPIError, sendLovableEmail } from "@lovable.dev/email-js";

// Server-only. Reads LOVABLE_API_KEY.

const SITE_NAME = "Flowmail";
/** Verified sender subdomain delegated to Lovable's nameservers. */
const SENDER_DOMAIN = "notify.digitalgoodsmart.xyz";

export function appBaseUrl() {
  return (
    process.env["APP_BASE_URL"] ??
    // Use the stable development deployment until APP_BASE_URL is configured
    // for a published/custom domain. The production hostname returns 404 while
    // the project is unpublished, which prevents open/click events from ever
    // reaching the workflow engine.
    "https://project--32e7732a-e123-44dd-adf0-369d5f618cf8-dev.lovable.app"
  );
}

/** Builds the From header. Managed sending only allows the verified domain. */
function fromHeader(fromEmail?: string | null, fromName?: string | null) {
  const name = (fromName || SITE_NAME).replace(/[<>]/g, "").trim() || SITE_NAME;
  const address =
    fromEmail && fromEmail.toLowerCase().endsWith(`@${SENDER_DOMAIN}`)
      ? fromEmail
      : `noreply@${SENDER_DOMAIN}`;
  return `${name} <${address}>`;
}

export type RawSendResult =
  | { sent: true }
  | { sent: false; reason: string; retryAfterSeconds?: number };

export async function sendRawEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string | null;
  fromName?: string | null;
  replyTo?: string | null;
  label?: string;
  idempotencyKey?: string;
}): Promise<RawSendResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  try {
    await sendLovableEmail(
      {
        to: opts.to,
        from: fromHeader(opts.fromEmail, opts.fromName),
        sender_domain: SENDER_DOMAIN,
        subject: opts.subject || "(no subject)",
        html: opts.html,
        text: opts.text ?? htmlToText(opts.html),
        // The managed API only accepts app emails without a run_id when
        // purpose is "transactional" + an idempotency key is supplied.
        purpose: "transactional",
        label: opts.label ?? "campaign",
        idempotency_key: opts.idempotencyKey || crypto.randomUUID(),
        reply_to: opts.replyTo || opts.fromEmail || undefined,
      },
      { apiKey, sendUrl: process.env["LOVABLE_SEND_URL"] },
    );
  } catch (error) {
    if (error instanceof EmailAPIError) {
      return {
        sent: false,
        reason: error.code ?? "send_failed",
        retryAfterSeconds: error.retryAfterSeconds ?? undefined,
      };
    }
    return { sent: false, reason: (error as Error).message };
  }
  return { sent: true };
}

export function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Adds the open pixel and rewrites links through the click tracker so opens and
 * clicks can be attributed to a single recipient.
 */
export function instrumentHtml(html: string, sendId: string, opts?: { clicks?: boolean }) {
  const base = appBaseUrl();
  let out = html || "";

  if (opts?.clicks !== false) {
    out = out.replace(/href="(https?:\/\/[^"]+)"/gi, (_m, url: string) => {
      if (url.includes("/api/public/t/")) return `href="${url}"`;
      return `href="${base}/api/public/t/click/${sendId}?u=${encodeURIComponent(url)}"`;
    });
  }

  // Do not use display:none: several inbox image proxies skip hidden images,
  // so the open event would never be delivered even when images are enabled.
  const pixel = `<img src="${base}/api/public/t/open/${sendId}" width="1" height="1" alt="" aria-hidden="true" style="width:1px;height:1px;border:0;opacity:0" />`;
  if (/<\/body>/i.test(out)) return out.replace(/<\/body>/i, `${pixel}</body>`);
  return out + pixel;
}
