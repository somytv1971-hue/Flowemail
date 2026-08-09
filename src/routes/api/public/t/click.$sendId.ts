import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/t/click/$sendId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const target = new URL(request.url).searchParams.get("u");
        const safe =
          target && /^https?:\/\//i.test(target) ? target : "https://lovable.dev";

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: row } = await supabaseAdmin
            .from("email_sends")
            .select("id,click_count,clicked_at,opened_at,open_count,run_id")
            .eq("id", params.sendId)
            .maybeSingle();
          if (row) {
            const now = new Date().toISOString();
            await supabaseAdmin
              .from("email_sends")
              .update({
                clicked_at: row.clicked_at ?? now,
                click_count: (row.click_count ?? 0) + 1,
                // a click implies an open, even when images are blocked
                opened_at: row.opened_at ?? now,
                open_count: row.opened_at ? row.open_count : (row.open_count ?? 0) + 1,
              })
              .eq("id", row.id);

            if (row.run_id) {
              await supabaseAdmin
                .from("workflow_runs")
                .update({ status: "active", wake_at: now })
                .eq("id", row.run_id)
                .in("status", ["waiting", "active"]);
              const { tickWorkflows } = await import("@/lib/workflow-engine.server");
              await tickWorkflows(20);
            }
          }
        } catch {
          // always redirect, even if tracking fails
        }

        return new Response(null, { status: 302, headers: { location: safe } });
      },
    },
  },
});
