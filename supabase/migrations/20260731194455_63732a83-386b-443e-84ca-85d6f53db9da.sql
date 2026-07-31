CREATE TABLE public.sender_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_default BOOLEAN NOT NULL DEFAULT false,
  confirm_token UUID NOT NULL DEFAULT gen_random_uuid(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sender_emails TO authenticated;
GRANT ALL ON public.sender_emails TO service_role;

ALTER TABLE public.sender_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own sender emails"
ON public.sender_emails FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER sender_emails_updated_at
BEFORE UPDATE ON public.sender_emails
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX sender_emails_token_idx ON public.sender_emails (confirm_token);