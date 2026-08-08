import { createFileRoute } from "@tanstack/react-router";

/** Temporary diagnostic endpoint for email delivery. */
export const Route = createFileRoute("/api/public/debug-send")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const to = url.searchParams.get("to") ?? "test@example.com";
        const purpose = url.searchParams.get("purpose") ?? "marketing";
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ ok: false, error: "no api key" });
        const { sendLovableEmail, EmailAPIError } = await import("@lovable.dev/email-js");
        try {
          const res = await sendLovableEmail(
            {
              to,
              from: "Flowmail <noreply@notify.digitalgoodsmart.xyz>",
              sender_domain: "notify.digitalgoodsmart.xyz",
              subject: "Debug send",
              html: "<p>debug</p>",
              text: "debug",
              purpose,
              label: "debug",
              idempotency_key: crypto.randomUUID(),
            },
            { apiKey },
          );
          return Response.json({ ok: true, res });
        } catch (e) {
          const err = e as any;
          return Response.json({
            ok: false,
            code: err?.code,
            status: err?.status,
            message: err?.message,
            isApi: e instanceof EmailAPIError,
          });
        }
      },
    },
  },
});
