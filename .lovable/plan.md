
## Scope (Phase 1)

Build a GetResponse-inspired email marketing dashboard. This phase focuses on the **Automation → Workflows** screen with real backend (CRUD), email/password auth, and the full navigation shell. Contacts, Reports, Automation Messages, Events, and Autoresponder pages will be scaffolded as placeholders and built out in later phases.

## Design Direction

Modern SaaS dashboard — not a GetResponse clone. Clean, spacious, professional:
- Deep indigo/violet primary with soft neutrals (light mode first, dark mode ready)
- Rounded cards, subtle shadows, generous whitespace
- Inter (body) + a distinctive display font for headings
- Custom sidebar + topbar layout instead of GetResponse's cyan bar

## Navigation Structure

```
Topbar: Logo | Email Marketing ▾ | Contacts | Reports        | User menu
                 └─ Automation
                 └─ Autoresponder
```

Routes:
- `/` — public landing (marketing page, sign-in CTA)
- `/auth` — login / signup
- `/_authenticated/dashboard` — signed-in home (overview cards)
- `/_authenticated/automation` — tabs: **Workflows** | Automation messages | Events
- `/_authenticated/autoresponder` — placeholder
- `/_authenticated/contacts` — placeholder
- `/_authenticated/reports` — placeholder

## Workflows Page (main deliverable)

Matches the screenshot's information architecture with our own visual style:
- Tabs: Workflows / Automation messages / Events
- Toolbar: "Show statistics for" filter, "Sort by" dropdown, **Create workflow** button, search
- Table columns: checkbox, Name, Status (published toggle), Created on, Start on, End on, Completed, In progress, row menu (⋯)
- Row actions menu: Edit name, Duplicate, Delete
- Empty state when no workflows
- "Create workflow" opens a dialog: name + start date → inserts row, defaults published=true, completed=0, in_progress=0

Automation messages & Events tabs render "Coming soon" placeholders in this phase.

## Backend (Lovable Cloud)

**Auth:** email/password, no profiles table needed for this phase.

**Table:** `workflows`
| column | type |
|---|---|
| id | uuid pk |
| user_id | uuid → auth.users |
| name | text |
| status | text default 'published' |
| start_on | timestamptz |
| end_on | timestamptz nullable |
| completed | int default 0 |
| in_progress | int default 0 |
| created_at | timestamptz default now() |

- Grants to `authenticated` + `service_role`
- RLS: users can select/insert/update/delete only their own rows (`auth.uid() = user_id`)

**Server functions** (`createServerFn` + `requireSupabaseAuth`): `listWorkflows`, `createWorkflow`, `updateWorkflow`, `deleteWorkflow`. Called from the Workflows page via TanStack Query.

## Out of scope this phase

Actual email sending, workflow-builder canvas, contact lists, campaign reports, autoresponder logic. These are the next milestones once the shell + workflows CRUD is approved.

---

Approve and I'll build Phase 1.
