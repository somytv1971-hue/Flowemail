import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { confirmSenderEmail } from '@/lib/sender-emails.functions'

export const Route = createFileRoute('/confirm-sender')({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: 'Confirm sender address — Flowmail' },
      {
        name: 'description',
        content: 'Confirm your sender email address to start sending campaigns with Flowmail.',
      },
      { property: 'og:title', content: 'Confirm sender address — Flowmail' },
      {
        property: 'og:description',
        content: 'Confirm your sender email address to start sending campaigns with Flowmail.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: ConfirmPage,
})

function ConfirmPage() {
  const { token } = Route.useSearch()
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const cleanToken = token?.trim()
    if (!cleanToken) {
      setState('error')
      return
    }

    let isMounted = true

    async function handleConfirm() {
      // 1. Try server function
      try {
        const res = await confirmSenderEmail({ data: { token: cleanToken! } })
        if (res?.ok) {
          if (isMounted) {
            setEmail(res.email ?? '')
            setState('done')
          }
          return
        }
      } catch (err) {
        console.warn('Server confirmation failed, attempting client fallback:', err)
      }

      // 2. Client-side fallback if user is authenticated in browser session
      try {
        const { supabase } = await import('@/integrations/supabase/client')
        const { data: row, error } = await supabase
          .from('sender_emails')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('confirm_token', cleanToken!)
          .select('email')
          .maybeSingle()

        if (!error && row) {
          if (isMounted) {
            setEmail(row.email ?? '')
            setState('done')
          }
          return
        }
      } catch (err) {
        console.error('Client confirmation error:', err)
      }

      if (isMounted) {
        setState('error')
      }
    }

    void handleConfirm()

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        {state === 'loading' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-semibold">Confirming your address…</h1>
          </>
        )}
        {state === 'done' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-xl font-semibold">Address confirmed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {email ? `${email} is ready to send from.` : 'You can now send from this address.'}
            </p>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold">Link is invalid or expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Request a new confirmation email from Emails and domains.
            </p>
          </>
        )}
        <Button asChild className="mt-6 w-full">
          <Link to="/emails-and-domains">Go to Emails and domains</Link>
        </Button>
      </div>
    </main>
  )
}
