import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listContactLists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("contact_lists")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: counts, error: cErr } = await context.supabase
      .from("contacts")
      .select("list_id");
    if (cErr) throw new Error(cErr.message);
    const byList = new Map<string, number>();
    for (const row of counts ?? []) {
      if (!row.list_id) continue;
      byList.set(row.list_id, (byList.get(row.list_id) ?? 0) + 1);
    }
    return (data ?? []).map((l) => ({ ...l, contact_count: byList.get(l.id) ?? 0 }));
  });

export const createContactList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(500).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("contact_lists")
      .insert({ user_id: context.userId, name: data.name, description: data.description })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteContactList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("contact_lists").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ listId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data.listId) query = query.eq("list_id", data.listId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const contactSchema = z.object({
  list_id: z.string().uuid(),
  email: z.string().trim().email(),
  first_name: z.string().trim().max(80).default(""),
  last_name: z.string().trim().max(80).default(""),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export const addContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("contacts")
      .upsert(
        { ...data, user_id: context.userId, status: "subscribed" },
        { onConflict: "user_id,list_id,email" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { enrollContacts, tickWorkflows } = await import("@/lib/workflow-engine.server");
    await enrollContacts({
      userId: context.userId,
      listId: data.list_id,
      contactIds: [row.id],
    });
    await tickWorkflows(25);

    return row;
  });

export const addContactsBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ list_id: z.string().uuid(), raw: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const seen = new Set<string>();
    const rows = data.raw
      .split(/[\n,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s))
      .filter((email) => {
        if (seen.has(email)) return false;
        seen.add(email);
        return true;
      })
      .map((email) => ({
        user_id: context.userId,
        list_id: data.list_id,
        email,
        status: "subscribed",
      }));
    if (rows.length === 0) return { inserted: 0 };

    const { data: inserted, error } = await context.supabase
      .from("contacts")
      .upsert(rows, { onConflict: "user_id,list_id,email" })
      .select("id");
    if (error) throw new Error(error.message);

    const { enrollContacts, tickWorkflows } = await import("@/lib/workflow-engine.server");
    await enrollContacts({
      userId: context.userId,
      listId: data.list_id,
      contactIds: (inserted ?? []).map((r) => r.id),
    });
    await tickWorkflows(50);

    return { inserted: rows.length };
  });


export const deleteContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("contacts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateContactStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["subscribed", "unsubscribed", "bounced"]) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("contacts")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
