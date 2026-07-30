CREATE TABLE public.automation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Untitled automation message',
  list_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'incomplete',
  from_email text NOT NULL DEFAULT '',
  reply_to text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  preview_text text NOT NULL DEFAULT '',
  layout text,
  content_html text NOT NULL DEFAULT '',
  track_opens boolean NOT NULL DEFAULT true,
  track_clicks boolean NOT NULL DEFAULT false,
  delivered integer NOT NULL DEFAULT 0,
  open_rate numeric,
  click_rate numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_messages TO authenticated;
GRANT ALL ON public.automation_messages TO service_role;

ALTER TABLE public.automation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own automation messages"
ON public.automation_messages FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_automation_messages_updated_at
BEFORE UPDATE ON public.automation_messages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();