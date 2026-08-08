import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Sends one automation message to every subscribed contact in a list. */
export const sendMessageToList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ message_id: z.string().uuid(), list_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: message, error: mErr } = await context.supabase
      .from("automation_messages")
      .select("*")
      .eq("id", data.message_id)
      .single();
    if (mErr) throw new Error(mErr.message);

    const { data: contacts, error: cErr } = await context.supabase
      .from("contacts")
      .select("*")
      .eq("list_id", data.list_id)
      .eq("status", "subscribed");
    if (cErr) throw new Error(cErr.message);
    if (!contacts?.length) return { sent: 0, failed: 0, total: 0 };

    const { sendMessageToContact } = await import("@/lib/workflow-engine.server");

    let sent = 0;
    let failed = 0;
    for (const contact of contacts) {
      const res = await sendMessageToContact({
        userId: context.userId,
        message,
        contact,
        listId: data.list_id,
      });
      if (res.sent) sent++;
      else failed++;
    }

    await context.supabase
      .from("automation_messages")
      .update({ status: "in_use", delivered: (message.delivered ?? 0) + sent })
      .eq("id", message.id);

    return { sent, failed, total: contacts.length };
  });

/** Sends the message to a single address so the user can check it. */
export const sendTestMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ message_id: z.string().uuid(), email: z.string().trim().email() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: message, error } = await context.supabase
      .from("automation_messages")
      .select("*")
      .eq("id", data.message_id)
      .single();
    if (error) throw new Error(error.message);

    const { sendMessageToContact } = await import("@/lib/workflow-engine.server");
    const res = await sendMessageToContact({
      userId: context.userId,
      message: { ...message, subject: `[Test] ${message.subject ?? ""}` },
      contact: { email: data.email, first_name: "", last_name: "" },
    });
    if (!res.sent) throw new Error(res.reason ?? "Could not send the test email");
    return { ok: true };
  });

/**
 * Puts every subscribed contact of the workflow's Subscribe list into the
 * workflow and immediately advances the due runs.
 */
export const startWorkflowNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workflow_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: wf, error } = await context.supabase
      .from("workflows")
      .select("*")
      .eq("id", data.workflow_id)
      .single();
    if (error) throw new Error(error.message);

    const nodes = (wf.nodes ?? []) as Record<string, any>[];
    const start = nodes.find((n) => n.type === "start") ?? nodes[0];
    const cfg = (start?.config ?? {}) as Record<string, any>;

    let listQuery = context.supabase.from("contacts").select("id,list_id").eq("status", "subscribed");
    if (cfg.list_mode === "specific" && cfg.list_id) listQuery = listQuery.eq("list_id", cfg.list_id);
    const { data: contacts, error: cErr } = await listQuery;
    if (cErr) throw new Error(cErr.message);
    if (!contacts?.length) return { enrolled: 0, processed: 0 };

    const { enrollContacts, tickWorkflows } = await import("@/lib/workflow-engine.server");

    const byList = new Map<string, string[]>();
    for (const c of contacts) {
      if (!c.list_id) continue;
      byList.set(c.list_id, [...(byList.get(c.list_id) ?? []), c.id]);
    }
    let enrolled = 0;
    for (const [listId, ids] of byList) {
      const r = await enrollContacts({ userId: context.userId, listId, contactIds: ids });
      enrolled += r.enrolled;
    }
    const { processed } = await tickWorkflows(100);
    return { enrolled, processed };
  });

/** Advances every due workflow run right now. */
export const runWorkflowTick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { tickWorkflows } = await import("@/lib/workflow-engine.server");
    return tickWorkflows(100);
  });
