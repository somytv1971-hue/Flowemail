import { createFileRoute } from "@tanstack/react-router";

const PIXEL = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0, 0, 0,
  0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59,
]);

export const Route = createFileRoute("/api/public/t/open/$sendId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: row } = await supabaseAdmin
            .from("email_sends")
            .select("id,open_count,opened_at")
            .eq("id", params.sendId)
            .maybeSingle();
          if (row) {
            await supabaseAdmin
              .from("email_sends")
              .update({
                opened_at: row.opened_at ?? new Date().toISOString(),
                open_count: (row.open_count ?? 0) + 1,
              })
              .eq("id", row.id);
          }
        } catch {
          // never break image loading in the recipient's inbox
        }

        return new Response(PIXEL, {
          headers: {
            "content-type": "image/gif",
            "cache-control": "no-store, no-cache, must-revalidate, private",
          },
        });
      },
    },
  },
});
