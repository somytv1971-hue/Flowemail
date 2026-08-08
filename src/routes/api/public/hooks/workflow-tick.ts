import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduler endpoint. Called on a timer (pg_cron) and also from the app after
 * changes that create work, so runs advance without waiting for the next tick.
 */
export const Route = createFileRoute("/api/public/hooks/workflow-tick")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { tickWorkflows } = await import("@/lib/workflow-engine.server");
          const result = await tickWorkflows(100);
          return Response.json({ ok: true, ...result });
        } catch (error) {
          return Response.json({ ok: false, error: (error as Error).message }, { status: 500 });
        }
      },
      GET: async () => {
        const { tickWorkflows } = await import("@/lib/workflow-engine.server");
        const result = await tickWorkflows(100);
        return Response.json({ ok: true, ...result });
      },
    },
  },
});
