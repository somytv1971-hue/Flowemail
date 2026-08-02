CREATE TABLE IF NOT EXISTS public.autoresponders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled autoresponder',
  list_name TEXT NOT NULL DEFAULT 'main_list',
  status TEXT NOT NULL DEFAULT 'off',
  cycle_day INTEGER NOT NULL DEFAULT 0,
  send_mode TEXT NOT NULL DEFAULT 'signup_time',
  send_time TEXT NOT NULL DEFAULT '09:00',
  days_of_week JSONB NOT NULL DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]'::jsonb,
  from_email TEXT NOT NULL DEFAULT '',
  reply_to TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  message_id UUID REFERENCES public.automation_messages(id) ON DELETE SET NULL,
  track_opens BOOLEAN NOT NULL DEFAULT true,
  track_clicks BOOLEAN NOT NULL DEFAULT false,
  delivered INTEGER NOT NULL DEFAULT 0,
  open_rate NUMERIC NOT NULL DEFAULT 0,
  click_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.autoresponders TO authenticated;
GRANT ALL ON public.autoresponders TO service_role;
ALTER TABLE public.autoresponders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own autoresponders" ON public.autoresponders;
CREATE POLICY "Users manage own autoresponders" ON public.autoresponders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.set_updated_at_autoresponders() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_autoresponders_updated_at ON public.autoresponders;
CREATE TRIGGER trg_autoresponders_updated_at BEFORE UPDATE ON public.autoresponders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_autoresponders();