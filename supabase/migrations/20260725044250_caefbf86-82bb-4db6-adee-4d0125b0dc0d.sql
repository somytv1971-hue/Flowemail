ALTER TABLE public.workflows
  ADD COLUMN channel TEXT NOT NULL DEFAULT 'email',
  ADD COLUMN start_element TEXT,
  ADD COLUMN nodes JSONB NOT NULL DEFAULT '[]'::jsonb;