# Make Flowmail actually send and automate

Right now every screen stores settings but nothing is executed. This plan adds a real
sending engine, open/click tracking, and a workflow runtime so the nodes you built do work.

## 1. Real email sending

- A "Send now / Send test" action on an automation message renders its saved content
  and sends it to every subscribed contact of the linked list, using the confirmed
  sender address chosen in the From / Reply-to fields.
- Each recipient gets a personal send record so we can track what happened to it.
- Suppressed, unsubscribed and bounced contacts are skipped automatically.

## 2. Open and click tracking sensors

- Every outgoing email gets an invisible 1x1 tracking pixel and rewritten links,
  both keyed to that recipient's send record.
- Public endpoints record the open/click, then return the pixel or redirect.
- Open rate / click rate / delivered on the message, autoresponder and workflow lists
  become live numbers instead of zeros.

## 3. Workflow runtime

Contacts travel through the canvas as "runs":

- **Subscribe node** — when a contact is added to (or imported into) the selected list,
  a run starts at that node.
- **Send message node** — sends the message picked in the node panel to that contact.
- **Email was opened node** — waits for an open on the last sent message; branches
  green (opened) or red (not opened after the configured wait window).
- **Move to list node** — adds the contact to the target list.
- **Remove contact node** — removes the contact from the configured source.
- **Wait node** — pauses the run for the configured days/hours/minutes (and weekday /
  exact-time variants).

A scheduler tick runs periodically, wakes every run whose time has come, executes the
next node, and stores the new position. Runs end at the last node.

## 4. Statistics

- **In progress** = runs currently sitting in the workflow, **Completed** = runs that
  reached the end. Shown live on the workflow list and canvas bar.
- Reports page replaced with real numbers: sends, delivered, opens, clicks, unsubscribes,
  per message and per workflow, with a recent-activity table.

## 5. Sweep of dead UI

Every remaining placeholder gets wired or removed: Events tab, Reports, contact segment
tabs, autoresponder on/off actually gating sends, and node panels that currently save
nothing.

## Technical notes

- New tables: `email_sends` (per-recipient send + open/click timestamps),
  `workflow_runs` (contact position, wake time, status), `workflow_events` (audit log),
  all with RLS scoped to `auth.uid()` and explicit GRANTs.
- Sending goes through the existing managed email helper (`sendTemplateEmail` extended
  with a raw-HTML path) using the verified `notify.digitalgoodsmart.xyz` sender domain.
- Tracking + scheduler live under `src/routes/api/public/*` (open pixel, click redirect,
  workflow tick with a shared-secret header); pg_cron calls the tick every minute.
- Node execution logic in `src/lib/workflow-engine.server.ts`, invoked from the tick
  route and from contact-subscribe server functions.
- Rate: batches capped per tick so a large list drains over several ticks rather than
  timing out.
