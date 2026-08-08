import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { instrumentHtml, sendRawEmail } from "@/lib/email-send.server";
import { renderMessageHtml } from "@/lib/builder-render";

/** Server-only workflow runtime. Uses the service-role client. */

type Json = Record<string, any>;

const CONDITION_ELEMENTS = ["opens_message", "c_message_opened"];
const MAX_STEPS_PER_RUN = 12;

function nodesOf(wf: Json) {
  return (wf.nodes ?? []) as Json[];
}
function edgesOf(wf: Json) {
  return (wf.edges ?? []) as Json[];
}
function startNode(wf: Json) {
  const nodes = nodesOf(wf);
  return nodes.find((n) => n.type === "start") ?? nodes[0];
}
function nextNodeId(wf: Json, nodeId: string, branch?: "yes" | "no") {
  const edges = edgesOf(wf).filter((e) => e.source === nodeId);
  if (branch) {
    const match = edges.find((e) => e.branch === branch);
    if (match) return match.target as string;
    return null;
  }
  const plain = edges.find((e) => !e.branch) ?? edges[0];
  return (plain?.target as string) ?? null;
}

async function logEvent(row: {
  user_id: string;
  workflow_id?: string | null;
  run_id?: string | null;
  node_id?: string | null;
  type: string;
  detail?: string;
  email?: string | null;
}) {
  await supabaseAdmin.from("workflow_events").insert({ detail: "", ...row });
}

/* ------------------------------------------------------------------ */
/* Enrollment                                                          */
/* ------------------------------------------------------------------ */

/**
 * Starts a run in every published workflow whose Subscribe node matches the
 * list a contact was just added to.
 */
export async function enrollContacts(params: {
  userId: string;
  listId: string;
  contactIds: string[];
}) {
  if (params.contactIds.length === 0) return { enrolled: 0 };

  const { data: workflows } = await supabaseAdmin
    .from("workflows")
    .select("*")
    .eq("user_id", params.userId)
    .eq("status", "published");
  if (!workflows?.length) return { enrolled: 0 };

  const { data: list } = await supabaseAdmin
    .from("contact_lists")
    .select("id,name")
    .eq("id", params.listId)
    .maybeSingle();

  const { data: contacts } = await supabaseAdmin
    .from("contacts")
    .select("id,email,status")
    .in("id", params.contactIds);
  const usable = (contacts ?? []).filter((c) => c.status === "subscribed");
  if (usable.length === 0) return { enrolled: 0 };

  const rows: Json[] = [];
  for (const wf of workflows) {
    const start = startNode(wf);
    if (!start) continue;
    const cfg = (start.config ?? {}) as Json;
    if (cfg.list_mode === "specific") {
      const matches =
        cfg.list_id === params.listId || (list?.name && cfg.list_name === list.name);
      if (!matches) continue;
    }
    const first = nextNodeId(wf, start.id) ?? null;
    for (const c of usable) {
      rows.push({
        user_id: params.userId,
        workflow_id: wf.id,
        contact_id: c.id,
        email: c.email,
        node_id: first,
        status: first ? "active" : "completed",
        wake_at: new Date().toISOString(),
        completed_at: first ? null : new Date().toISOString(),
        context: { list_id: params.listId },
      });
    }
  }
  if (rows.length === 0) return { enrolled: 0 };

  const { error } = await supabaseAdmin
    .from("workflow_runs")
    .upsert(rows as never, { onConflict: "workflow_id,contact_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  return { enrolled: rows.length };
}

/* ------------------------------------------------------------------ */
/* Sending                                                             */
/* ------------------------------------------------------------------ */

function renderPersonal(html: string, contact: Json) {
  return (html || "")
    .replace(/\{\{\s*first_name\s*\}\}/gi, contact.first_name || "")
    .replace(/\{\{\s*last_name\s*\}\}/gi, contact.last_name || "")
    .replace(/\{\{\s*email\s*\}\}/gi, contact.email || "");
}

/** Creates the send record, injects tracking, sends, and records the outcome. */
export async function sendMessageToContact(params: {
  userId: string;
  message: Json;
  contact: Json;
  workflowId?: string | null;
  runId?: string | null;
  autoresponderId?: string | null;
  listId?: string | null;
}) {
  const { message, contact } = params;

  const { data: send, error } = await supabaseAdmin
    .from("email_sends")
    .insert({
      user_id: params.userId,
      message_id: message.id ?? null,
      workflow_id: params.workflowId ?? null,
      run_id: params.runId ?? null,
      autoresponder_id: params.autoresponderId ?? null,
      contact_id: contact.id ?? null,
      list_id: params.listId ?? null,
      email: contact.email,
      subject: message.subject ?? "",
      status: "queued",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const rendered = renderMessageHtml(message.content_html ?? "");
  const html = instrumentHtml(renderPersonal(rendered, contact), send.id, {
    clicks: message.track_clicks !== false,
  });

  const result = await sendRawEmail({
    to: contact.email,
    subject: renderPersonal(message.subject ?? "", contact),
    html,
    fromEmail: message.from_email,
    replyTo: message.reply_to,
    label: "automation-message",
    idempotencyKey: send.id,
  });

  await supabaseAdmin
    .from("email_sends")
    .update(
      result.sent
        ? { status: "sent", sent_at: new Date().toISOString() }
        : { status: result.reason === "recipient_suppressed" ? "suppressed" : "failed", error: result.reason },
    )
    .eq("id", send.id);

  return { sendId: send.id as string, sent: result.sent, reason: result.sent ? null : result.reason };
}

/* ------------------------------------------------------------------ */
/* Node execution                                                      */
/* ------------------------------------------------------------------ */

function waitMillis(cfg: Json) {
  const days = Number(cfg.wait_days ?? 0);
  const hours = Number(cfg.wait_hours ?? 0);
  const minutes = Number(cfg.wait_minutes ?? 0);
  const ms = ((days * 24 + hours) * 60 + minutes) * 60_000;
  return ms > 0 ? ms : 60_000;
}

function nextWakeForWait(cfg: Json): Date {
  const now = new Date();
  const type = cfg.wait_type ?? "for";

  if (type === "for") {
    let target = new Date(now.getTime() + waitMillis(cfg));
    const weekdays: string[] = cfg.wait_weekdays ?? [];
    if (weekdays.length > 0) {
      const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      for (let i = 0; i < 7 && !weekdays.includes(map[target.getDay()]!); i++) {
        target = new Date(target.getTime() + 86_400_000);
      }
    }
    return target;
  }

  if (type === "specific" && cfg.wait_date) {
    const [h, m] = String(cfg.wait_time ?? "09:00").split(":");
    const d = new Date(`${cfg.wait_date}T00:00:00Z`);
    d.setUTCHours(Number(h ?? 9), Number(m ?? 0), 0, 0);
    return d > now ? d : now;
  }

  if (type === "nth_day") {
    const nth = Math.min(28, Math.max(1, Number(cfg.wait_nth ?? 1)));
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), nth, 9, 0, 0));
    if (d <= now) d.setUTCMonth(d.getUTCMonth() + 1);
    return d;
  }

  // "until" — next occurrence of the configured time of day
  const [h, m] = String(cfg.wait_time ?? "09:00").split(":");
  const d = new Date(now);
  d.setUTCHours(Number(h ?? 9), Number(m ?? 0), 0, 0);
  if (d <= now) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

async function finish(runId: string, status: "completed" | "failed", error?: string) {
  await supabaseAdmin
    .from("workflow_runs")
    .update({
      status,
      error: error ?? null,
      completed_at: new Date().toISOString(),
      node_id: null,
    })
    .eq("id", runId);
}

/** Executes one run until it must wait, ends, or hits the step cap. */
async function advanceRun(run: Json, wf: Json) {
  let nodeId: string | null = run.node_id;
  let context: Json = run.context ?? {};
  let lastSendId: string | null = run.last_send_id ?? null;

  for (let step = 0; step < MAX_STEPS_PER_RUN; step++) {
    if (!nodeId) return finish(run.id, "completed");
    const node = nodesOf(wf).find((n) => n.id === nodeId);
    if (!node) return finish(run.id, "completed");

    const cfg = (node.config ?? {}) as Json;
    const el = node.element as string;

    const { data: contact } = await supabaseAdmin
      .from("contacts")
      .select("*")
      .eq("id", run.contact_id)
      .maybeSingle();
    if (!contact) return finish(run.id, "completed", "Contact no longer exists");

    /* --- Send message ------------------------------------------------ */
    if (el === "a_send_message") {
      if (!cfg.message_id) {
        await logEvent({
          user_id: run.user_id,
          workflow_id: wf.id,
          run_id: run.id,
          node_id: node.id,
          type: "skipped",
          detail: "No message selected on the Send message step",
          email: run.email,
        });
      } else {
        const { data: message } = await supabaseAdmin
          .from("automation_messages")
          .select("*")
          .eq("id", cfg.message_id)
          .maybeSingle();
        if (message) {
          const res = await sendMessageToContact({
            userId: run.user_id,
            message,
            contact,
            workflowId: wf.id,
            runId: run.id,
            listId: contact.list_id,
          });
          lastSendId = res.sendId;
          context = { ...context, last_message_id: message.id };
          await logEvent({
            user_id: run.user_id,
            workflow_id: wf.id,
            run_id: run.id,
            node_id: node.id,
            type: res.sent ? "message_sent" : "message_failed",
            detail: res.sent ? (message.subject ?? "") : (res.reason ?? ""),
            email: run.email,
          });
        }
      }
      nodeId = nextNodeId(wf, node.id);
      continue;
    }

    /* --- Email was opened (condition) --------------------------------- */
    if (CONDITION_ELEMENTS.includes(el)) {
      const deadlineKey = `open_deadline_${node.id}`;
      const deadline = context[deadlineKey] as string | undefined;

      let query = supabaseAdmin
        .from("email_sends")
        .select("id,opened_at")
        .eq("run_id", run.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (cfg.scope === "specific" && cfg.message_id) {
        query = supabaseAdmin
          .from("email_sends")
          .select("id,opened_at")
          .eq("run_id", run.id)
          .eq("message_id", cfg.message_id)
          .order("created_at", { ascending: false })
          .limit(1);
      }
      const { data: sends } = await query;
      const opened = Boolean(sends?.[0]?.opened_at);

      if (opened) {
        context = { ...context, [deadlineKey]: undefined };
        await logEvent({
          user_id: run.user_id,
          workflow_id: wf.id,
          run_id: run.id,
          node_id: node.id,
          type: "condition_yes",
          detail: "Message was opened",
          email: run.email,
        });
        nodeId = nextNodeId(wf, node.id, "yes");
        continue;
      }

      const waitMs =
        cfg.wait_mode === "never"
          ? 0
          : ((Number(cfg.days ?? 0) * 24 + Number(cfg.hours ?? 0)) * 60 +
              Number(cfg.minutes ?? 0)) *
            60_000;

      if (cfg.wait_mode !== "never" && waitMs > 0) {
        if (!deadline) {
          const until = new Date(Date.now() + waitMs).toISOString();
          await supabaseAdmin
            .from("workflow_runs")
            .update({
              context: { ...context, [deadlineKey]: until },
              last_send_id: lastSendId,
              status: "waiting",
              wake_at: until,
              node_id: node.id,
            })
            .eq("id", run.id);
          return;
        }
        if (new Date(deadline) > new Date()) {
          await supabaseAdmin
            .from("workflow_runs")
            .update({ status: "waiting", wake_at: deadline, node_id: node.id, context })
            .eq("id", run.id);
          return;
        }
      }

      await logEvent({
        user_id: run.user_id,
        workflow_id: wf.id,
        run_id: run.id,
        node_id: node.id,
        type: "condition_no",
        detail: "Message was not opened in time",
        email: run.email,
      });
      nodeId = nextNodeId(wf, node.id, "no");
      continue;
    }

    /* --- Move / copy to list ------------------------------------------ */
    if (el === "a_move_list" || el === "a_copy_list") {
      const targetId = cfg.target_list_id as string | undefined;
      if (targetId) {
        await supabaseAdmin.from("contacts").upsert(
          {
            user_id: run.user_id,
            list_id: targetId,
            email: contact.email,
            first_name: contact.first_name ?? "",
            last_name: contact.last_name ?? "",
            status: "subscribed",
          },
          { onConflict: "user_id,list_id,email" },
        );
        if (el === "a_move_list" && contact.list_id && contact.list_id !== targetId) {
          await supabaseAdmin.from("contacts").delete().eq("id", contact.id);
        }
        await logEvent({
          user_id: run.user_id,
          workflow_id: wf.id,
          run_id: run.id,
          node_id: node.id,
          type: el === "a_move_list" ? "moved_to_list" : "copied_to_list",
          detail: (cfg.target_list_name as string) ?? "",
          email: run.email,
        });
      }
      nodeId = nextNodeId(wf, node.id);
      continue;
    }

    /* --- Remove contact ----------------------------------------------- */
    if (el === "a_remove_contact" || el === "a_remove_list") {
      const from = (cfg.remove_from as string) ?? "lists";
      if (from === "account") {
        await supabaseAdmin
          .from("contacts")
          .delete()
          .eq("user_id", run.user_id)
          .eq("email", contact.email);
      } else if (from === "lists" && cfg.list_id) {
        await supabaseAdmin
          .from("contacts")
          .delete()
          .eq("user_id", run.user_id)
          .eq("list_id", cfg.list_id)
          .eq("email", contact.email);
      } else {
        await supabaseAdmin.from("contacts").delete().eq("id", contact.id);
      }
      await logEvent({
        user_id: run.user_id,
        workflow_id: wf.id,
        run_id: run.id,
        node_id: node.id,
        type: "contact_removed",
        detail: from,
        email: run.email,
      });
      return finish(run.id, "completed");
    }

    /* --- Wait ---------------------------------------------------------- */
    if (el === "a_wait") {
      const resumeKey = `waited_${node.id}`;
      if (!context[resumeKey]) {
        const wake = nextWakeForWait(cfg);
        await supabaseAdmin
          .from("workflow_runs")
          .update({
            status: "waiting",
            wake_at: wake.toISOString(),
            node_id: node.id,
            last_send_id: lastSendId,
            context: { ...context, [resumeKey]: true },
          })
          .eq("id", run.id);
        return;
      }
      context = { ...context, [resumeKey]: undefined };
      nodeId = nextNodeId(wf, node.id);
      continue;
    }

    /* --- Anything else: pass through ----------------------------------- */
    nodeId = nextNodeId(wf, node.id);
  }

  // Step cap reached — resume on the next tick.
  await supabaseAdmin
    .from("workflow_runs")
    .update({
      node_id: nodeId,
      context,
      last_send_id: lastSendId,
      status: nodeId ? "active" : "completed",
      wake_at: new Date().toISOString(),
      completed_at: nodeId ? null : new Date().toISOString(),
    })
    .eq("id", run.id);
}

/** Processes every run that is due. Called by the scheduler route. */
/**
 * Sends autoresponder messages: every active autoresponder mails its message to
 * contacts of its list once they are `cycle_day` days past sign-up.
 */
export async function tickAutoresponders() {
  const { data: responders } = await supabaseAdmin
    .from("autoresponders")
    .select("*")
    .eq("status", "on");
  if (!responders?.length) return { sent: 0 };

  let sent = 0;
  for (const ar of responders) {
    if (!ar.message_id) continue;

    const { data: message } = await supabaseAdmin
      .from("automation_messages")
      .select("*")
      .eq("id", ar.message_id)
      .maybeSingle();
    if (!message) continue;

    const { data: list } = await supabaseAdmin
      .from("contact_lists")
      .select("id")
      .eq("user_id", ar.user_id)
      .eq("name", ar.list_name)
      .maybeSingle();

    let q = supabaseAdmin
      .from("contacts")
      .select("*")
      .eq("user_id", ar.user_id)
      .eq("status", "subscribed")
      .lte(
        "created_at",
        new Date(Date.now() - Number(ar.cycle_day ?? 0) * 86_400_000).toISOString(),
      )
      .limit(200);
    if (list?.id) q = q.eq("list_id", list.id);
    const { data: contacts } = await q;
    if (!contacts?.length) continue;

    const { data: already } = await supabaseAdmin
      .from("email_sends")
      .select("contact_id")
      .eq("autoresponder_id", ar.id);
    const done = new Set((already ?? []).map((r) => r.contact_id));

    for (const contact of contacts) {
      if (done.has(contact.id)) continue;
      const res = await sendMessageToContact({
        userId: ar.user_id,
        message: {
          ...message,
          subject: ar.subject || message.subject,
          from_email: ar.from_email || message.from_email,
          reply_to: ar.reply_to || message.reply_to,
        },
        contact,
        autoresponderId: ar.id,
        listId: contact.list_id,
      });
      if (res.sent) sent++;
    }

    if (sent > 0) {
      await supabaseAdmin
        .from("autoresponders")
        .update({ delivered: (ar.delivered ?? 0) + sent })
        .eq("id", ar.id);
    }
  }
  return { sent };
}

export async function tickWorkflows(limit = 50) {
  const { data: runs, error } = await supabaseAdmin
    .from("workflow_runs")
    .select("*")
    .in("status", ["active", "waiting"])
    .lte("wake_at", new Date().toISOString())
    .order("wake_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  if (!runs?.length) return { processed: 0 };

  const wfCache = new Map<string, Json>();
  let processed = 0;

  for (const run of runs) {
    try {
      let wf = wfCache.get(run.workflow_id);
      if (!wf) {
        const { data } = await supabaseAdmin
          .from("workflows")
          .select("*")
          .eq("id", run.workflow_id)
          .maybeSingle();
        if (!data) {
          await finish(run.id, "completed", "Workflow deleted");
          continue;
        }
        wf = data;
        wfCache.set(run.workflow_id, data);
      }
      if (wf.status !== "published") continue; // paused: leave the run in place
      await advanceRun(run, wf);
      processed++;
    } catch (e) {
      await finish(run.id, "failed", (e as Error).message);
    }
  }

  await refreshWorkflowCounters();
  return { processed };
}

/** Keeps the workflow list's Completed / In progress columns in sync. */
export async function refreshWorkflowCounters() {
  const { data: runs } = await supabaseAdmin
    .from("workflow_runs")
    .select("workflow_id,status");
  if (!runs) return;
  const agg = new Map<string, { done: number; live: number }>();
  for (const r of runs) {
    const entry = agg.get(r.workflow_id) ?? { done: 0, live: 0 };
    if (r.status === "completed") entry.done++;
    else if (r.status === "active" || r.status === "waiting") entry.live++;
    agg.set(r.workflow_id, entry);
  }
  for (const [id, v] of agg) {
    await supabaseAdmin
      .from("workflows")
      .update({ completed: v.done, in_progress: v.live })
      .eq("id", id);
  }
}
