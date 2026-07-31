import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const schema = z.object({
  email: z.string().email(),
  senderName: z.string().max(120).optional(),
})

export const sendSenderConfirmation = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
    const confirmUrl = `${process.env['SITE_URL'] ?? ''}/emails-and-domains`
    const result = await sendTemplateEmail('sender-confirmation', data.email, {
      templateData: {
        senderName: data.senderName,
        email: data.email,
        confirmUrl: confirmUrl || undefined,
      },
      idempotencyKey: `sender-confirmation-${context.userId}-${data.email}`,
    })
    return result
  })
