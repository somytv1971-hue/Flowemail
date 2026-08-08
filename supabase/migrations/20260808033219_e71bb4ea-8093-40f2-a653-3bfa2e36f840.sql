DROP INDEX IF EXISTS public.workflow_runs_unique_contact;
CREATE UNIQUE INDEX workflow_runs_unique_contact ON public.workflow_runs (workflow_id, contact_id);