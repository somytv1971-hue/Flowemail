import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAutoresponders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("autoresponders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAutoresponder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("autoresponders")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createAutoresponder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims?.email as string | undefined) ?? "";
    const listName = email ? email.split("@")[0] : "main_list";

    const { data: msg, error: msgError } = await context.supabase
      .from("automation_messages")
      .insert({
        user_id: context.userId,
        name: "Untitled autoresponder message",
        list_name: listName,
        from_email: email,
        reply_to: email,
        status: "incomplete",
      })
      .select()
      .single();
    if (msgError) throw new Error(msgError.message);

    const { data: row, error } = await context.supabase
      .from("autoresponders")
      .insert({
        user_id: context.userId,
        name: "Untitled autoresponder",
        list_name: listName,
        from_email: email,
        reply_to: email,
        message_id: msg.id,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(128).optional(),
  list_name: z.string().max(128).optional(),
  status: z.enum(["on", "off"]).optional(),
  cycle_day: z.number().int().min(0).max(365).optional(),
  send_mode: z.enum(["signup_time", "immediately", "exact_time"]).optional(),
  send_time: z.string().max(10).optional(),
  days_of_week: z.array(z.string()).optional(),
  from_email: z.string().max(200).optional(),
  reply_to: z.string().max(200).optional(),
  subject: z.string().max(150).optional(),
  track_opens: z.boolean().optional(),
  track_clicks: z.boolean().optional(),
});

export const updateAutoresponder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("autoresponders")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAutoresponder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("autoresponders")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Returns the automation message linked to an autoresponder, creating and
 * linking one when the autoresponder has none yet (legacy rows).
 */
export const ensureAutoresponderMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("autoresponders")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (row.message_id) return { message_id: row.message_id as string };

    const { data: msg, error: msgError } = await context.supabase
      .from("automation_messages")
      .insert({
        user_id: context.userId,
        name: row.name ? `${row.name} — message` : "Untitled autoresponder message",
        list_name: row.list_name ?? "main_list",
        from_email: row.from_email ?? "",
        reply_to: row.reply_to ?? "",
        subject: row.subject ?? "",
        status: "incomplete",
      })
      .select()
      .single();
    if (msgError) throw new Error(msgError.message);

    const { error: linkError } = await context.supabase
      .from("autoresponders")
      .update({ message_id: msg.id })
      .eq("id", data.id);
    if (linkError) throw new Error(linkError.message);

    return { message_id: msg.id as string };
  });

/** Returns the autoresponder linked to a given automation message, if any. */
export const getAutoresponderByMessage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ message_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("autoresponders")
      .select("id")
      .eq("message_id", data.message_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { autoresponder_id: (row?.id as string | undefined) ?? null };
  });
