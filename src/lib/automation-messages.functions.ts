import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAutomationMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("automation_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAutomationMessage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("automation_messages")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createAutomationMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims?.email as string | undefined) ?? "";
    const { data: row, error } = await context.supabase
      .from("automation_messages")
      .insert({
        user_id: context.userId,
        name: "Untitled automation message",
        list_name: email ? email.split("@")[0] : "main_list",
        from_email: email,
        reply_to: email,
        status: "incomplete",
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
  status: z.enum(["incomplete", "in_use"]).optional(),
  from_email: z.string().max(200).optional(),
  reply_to: z.string().max(200).optional(),
  subject: z.string().max(150).optional(),
  preview_text: z.string().max(200).optional(),
  layout: z.string().max(50).nullable().optional(),
  content_html: z.string().optional(),
  track_opens: z.boolean().optional(),
  track_clicks: z.boolean().optional(),
});

export const updateAutomationMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("automation_messages")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAutomationMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("automation_messages")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
