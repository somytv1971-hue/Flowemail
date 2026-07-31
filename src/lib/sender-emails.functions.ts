import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export const listSenderEmails = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('sender_emails')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  })

export const addSenderEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email(),
        name: z.string().trim().max(120).default(''),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from('sender_emails')
      .upsert(
        { user_id: context.userId, email: data.email, name: data.name, status: 'pending' },
        { onConflict: 'user_id,email' },
      )
      .select()
      .single()
    if (error) throw new Error(error.message)

    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
    const origin = new URL(getRequest().url).origin
    const confirmUrl = `${origin}/confirm-sender?token=${row.confirm_token}`
    let sent = false
    let reason: string | null = null
    try {
      const result = await sendTemplateEmail('sender-confirmation', row.email, {
        templateData: { senderName: row.name || undefined, email: row.email, confirmUrl },
        idempotencyKey: `sender-confirmation-${row.id}-${row.confirm_token}`,
      })
      sent = result.sent
      reason = result.sent ? null : 'recipient_suppressed'
    } catch (err) {
      sent = false
      reason = err instanceof Error ? err.message : 'send_failed'
    }
    return { row, sent, reason, confirmUrl }
  })

export const resendSenderConfirmation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from('sender_emails')
      .select('*')
      .eq('id', data.id)
      .single()
    if (error) throw new Error(error.message)

    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
    const origin = new URL(getRequest().url).origin
    const confirmUrl = `${origin}/confirm-sender?token=${row.confirm_token}`
    let sent = false
    let reason: string | null = null
    try {
      const result = await sendTemplateEmail('sender-confirmation', row.email, {
        templateData: { senderName: row.name || undefined, email: row.email, confirmUrl },
        idempotencyKey: `sender-confirmation-resend-${row.id}-${Date.now()}`,
      })
      sent = result.sent
      reason = result.sent ? null : 'recipient_suppressed'
    } catch (err) {
      sent = false
      reason = err instanceof Error ? err.message : 'send_failed'
    }
    return { sent, reason, confirmUrl }
  })

export const deleteSenderEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('sender_emails').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const setDefaultSenderEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from('sender_emails')
      .update({ is_default: false })
      .eq('user_id', context.userId)
    const { error } = await context.supabase
      .from('sender_emails')
      .update({ is_default: true })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const confirmSenderEmail = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data: row, error } = await supabaseAdmin
      .from('sender_emails')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('confirm_token', data.token)
      .select('email')
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!row) return { ok: false as const }
    return { ok: true as const, email: row.email }
  })
