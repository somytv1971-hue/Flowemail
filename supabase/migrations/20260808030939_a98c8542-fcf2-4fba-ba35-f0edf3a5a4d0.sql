CREATE TABLE public.email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.automation_messages(id) ON DELETE SET NULL,
  workflow_id uuid REFERENCES public.workflows(id) ON DELETE SET NULL,
  run_id uuid,
  autoresponder_id uuid REFERENCES public.autoresponders(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  list_id uuid REFERENCES public.contact_lists(id) ON DELETE SET NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'queued',
  error text,
  sent_at timestamptz,
  opened_at timestamptz,
  open_count integer NOT NULL DEFAULT 0,
  clicked_at timestamptz,
  click_count integer NOT NULL DEFAULT 0,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_sends TO authenticated;
GRANT ALL ON public.email_sends TO service_role;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own email sends" ON public.email_sends FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX email_sends_user_idx ON public.email_sends(user_id, created_at DESC);
CREATE INDEX email_sends_message_idx ON public.email_sends(message_id);
CREATE INDEX email_sends_run_idx ON public.email_sends(run_id);

CREATE TABLE public.workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  email text NOT NULL,
  node_id text,
  status text NOT NULL DEFAULT 'active',
  wake_at timestamptz NOT NULL DEFAULT now(),
  last_send_id uuid,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_runs TO authenticated;
GRANT ALL ON public.workflow_runs TO service_role;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workflow runs" ON public.workflow_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX workflow_runs_unique_contact ON public.workflow_runs(workflow_id, contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX workflow_runs_due_idx ON public.workflow_runs(status, wake_at);
CREATE TRIGGER workflow_runs_updated_at BEFORE UPDATE ON public.workflow_runs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES public.workflows(id) ON DELETE CASCADE,
  run_id uuid,
  node_id text,
  type text NOT NULL,
  detail text NOT NULL DEFAULT '',
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_events TO authenticated;
GRANT ALL ON public.workflow_events TO service_role;
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workflow events" ON public.workflow_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX workflow_events_user_idx ON public.workflow_events(user_id, created_at DESC);