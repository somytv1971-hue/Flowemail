import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("workflows")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getWorkflow = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("workflows")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  channel: z.enum(["email", "web"]).default("email"),
  start_element: z.string().min(1),
});

export const createWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const startNode = {
      id: crypto.randomUUID(),
      type: "start",
      element: data.start_element,
      channel: data.channel,
      x: 400,
      y: 80,
    };
    const { data: row, error } = await context.supabase
      .from("workflows")
      .insert({
        user_id: context.userId,
        name: data.name,
        channel: data.channel,
        start_element: data.start_element,
        nodes: [startNode],
        start_on: new Date().toISOString(),
        status: "published",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["published", "paused"]).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

export const updateWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("workflows")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
    if (patch.nodes || patch.status === "published") {
      const { enrollExistingContactsForWorkflow, tickWorkflows } = await import(
        "@/lib/workflow-engine.server"
      );
      await enrollExistingContactsForWorkflow({ userId: context.userId, workflowId: id });
      await tickWorkflows(100);
    }
    return { ok: true };
  });

export const deleteWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("workflows")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
