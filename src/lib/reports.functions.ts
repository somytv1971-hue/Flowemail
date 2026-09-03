import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReportSummary = {
  total: number;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
  contacts: number;
  lists: number;
  activeRuns: number;
  completedRuns: number;
  daily: { date: string; sent: number; opened: number; clicked: number }[];
  recent: {
    id: string;
    email: string;
    subject: string;
    status: string;
    opened: boolean;
    clicked: boolean;
    created_at: string;
  }[];
};

export const getReportSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ days: z.number().int().min(1).max(365).default(30) }).parse(d ?? {}))
  .handler(async ({ data, context }): Promise<ReportSummary> => {
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();

    const [sends, contacts, lists, runs] = await Promise.all([
      context.supabase
        .from("email_sends")
        .select("id,email,subject,status,opened_at,clicked_at,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      context.supabase.from("contacts").select("id", { count: "exact", head: true }),
      context.supabase.from("contact_lists").select("id", { count: "exact", head: true }),
      context.supabase.from("workflow_runs").select("status"),
    ]);

    const rows = sends.data ?? [];
    const sent = rows.filter((r) => r.status === "sent").length;
    const failed = rows.filter((r) => r.status === "failed" || r.status === "suppressed").length;
    const opened = rows.filter((r) => r.opened_at).length;
    const clicked = rows.filter((r) => r.clicked_at).length;

    const buckets = new Map<string, { sent: number; opened: number; clicked: number }>();
    for (let i = data.days - 1; i >= 0; i--) {
      const key = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      buckets.set(key, { sent: 0, opened: 0, clicked: 0 });
    }
    for (const r of rows) {
      const key = String(r.created_at).slice(0, 10);
      const b = buckets.get(key);
      if (!b) continue;
      if (r.status === "sent") b.sent++;
      if (r.opened_at) b.opened++;
      if (r.clicked_at) b.clicked++;
    }

    const runRows = runs.data ?? [];

    return {
      total: rows.length,
      sent,
      failed,
      opened,
      clicked,
      openRate: sent ? Math.round((opened / sent) * 1000) / 10 : 0,
      clickRate: sent ? Math.round((clicked / sent) * 1000) / 10 : 0,
      contacts: contacts.count ?? 0,
      lists: lists.count ?? 0,
      activeRuns: runRows.filter((r) => r.status === "active" || r.status === "waiting").length,
      completedRuns: runRows.filter((r) => r.status === "completed").length,
      daily: [...buckets.entries()].map(([date, v]) => ({ date, ...v })),
      recent: rows.slice(0, 25).map((r) => ({
        id: r.id,
        email: r.email,
        subject: r.subject,
        status: r.status,
        opened: Boolean(r.opened_at),
        clicked: Boolean(r.clicked_at),
        created_at: r.created_at,
      })),
    };
  });

/** Feed for the Automation → Events tab. */
export const listWorkflowEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ workflow_id: z.string().uuid().optional(), limit: z.number().int().min(1).max(200).default(100) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("workflow_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.workflow_id) q = q.eq("workflow_id", data.workflow_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Live run counters for one workflow. */
export const getWorkflowStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ workflow_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("workflow_runs")
      .select("status")
      .eq("workflow_id", data.workflow_id);
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    return {
      in_progress: list.filter((r) => r.status === "active" || r.status === "waiting").length,
      completed: list.filter((r) => r.status === "completed").length,
      failed: list.filter((r) => r.status === "failed").length,
    };
  });
