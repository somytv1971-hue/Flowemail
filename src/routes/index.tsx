import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Zap,
  BarChart3,
  Users,
  ArrowRight,
  Sparkles,
  Send,
  Clock,
  GitBranch,
  MousePointerClick,
  ShieldCheck,
  LayoutTemplate,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flowmail — Email automation that actually sends" },
      {
        name: "description",
        content:
          "Visual workflows, autoresponders, drag-and-drop email builder, contact lists and live open/click reports — all in one focused workspace.",
      },
      { property: "og:title", content: "Flowmail — Email automation that actually sends" },
      {
        property: "og:description",
        content:
          "Visual workflows, autoresponders, drag-and-drop email builder, contact lists and live open/click reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: GitBranch,
    title: "Visual workflows",
    body: "Drag nodes onto the canvas and connect them — subscribe, send, wait, branch on opens.",
  },
  {
    icon: Send,
    title: "Autoresponders",
    body: "Sequential emails that fire on signup, day offsets or exact times, per list.",
  },
  {
    icon: LayoutTemplate,
    title: "Drag-and-drop builder",
    body: "40+ templates, brand kit colours, header and footer controls, live preview and test sends.",
  },
  {
    icon: Users,
    title: "Contacts & lists",
    body: "Import from CSV or Excel, dedupe automatically, search with advanced filters and segments.",
  },
  {
    icon: MousePointerClick,
    title: "Open & click tracking",
    body: "Every send is tracked per recipient, so workflow branches react the moment someone opens.",
  },
  {
    icon: ShieldCheck,
    title: "Domain authentication",
    body: "SPF, DKIM and DMARC verified live from your DNS before a single campaign goes out.",
  },
];

const STEPS = [
  { icon: Users, title: "Build your list", body: "Import contacts or collect them from your signup form." },
  { icon: Zap, title: "Design the flow", body: "Compose the email, then wire the automation on the canvas." },
  { icon: BarChart3, title: "Watch it run", body: "Live delivered, open, click and completion numbers." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">Flowmail</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button>Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-10%,var(--color-accent),transparent)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Workflows, autoresponders and live tracking
              </div>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                Automate every email your{" "}
                <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
                  audience deserves
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Draw the journey on a canvas, write the email in a drag-and-drop builder, and
                Flowmail sends it, tracks every open and click, and moves contacts between lists
                on its own.
              </p>

              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {[
                  "Verified sender domains",
                  "CSV & Excel imports",
                  "Open-based branching",
                  "Real-time reports",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/auth">
                  <Button size="lg" className="gap-2">
                    Start free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline">
                    See the builder
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mini workflow preview */}
            <div className="relative rounded-3xl border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="font-display text-sm font-semibold">Welcome flow</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                  Running
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { icon: Users, label: "Contact subscribes", meta: "MMO list" },
                  { icon: Send, label: "Send message", meta: "Welcome aboard" },
                  { icon: Clock, label: "Wait 1 day", meta: "then check" },
                  { icon: MousePointerClick, label: "Email was opened", meta: "yes → move to list" },
                ].map(({ icon: Icon, label, meta }, i, arr) => (
                  <div key={label}>
                    <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{label}</div>
                        <div className="truncate text-xs text-muted-foreground">{meta}</div>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="ml-[26px] h-4 w-px bg-border" aria-hidden />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-center">
                {[
                  ["Delivered", "1,284"],
                  ["Open rate", "48%"],
                  ["Clicks", "312"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="font-display text-lg font-semibold">{v}</div>
                    <div className="text-xs text-muted-foreground">{k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Everything the campaign needs
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            From the first import to the last click — no bolt-ons, no extra tools.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-y bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Live in three steps
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <div key={title} className="rounded-2xl border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-3xl border bg-gradient-to-br from-primary to-primary-glow p-10 text-center text-primary-foreground shadow-lg">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Send your first automated email today
            </h2>
            <p className="mx-auto mt-2 max-w-xl opacity-90">
              Set up a verified sender, import your list and let the workflow do the rest.
            </p>
            <Link to="/auth" className="mt-6 inline-block">
              <Button size="lg" variant="secondary" className="gap-2">
                Create your account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Link to="/" className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="font-display text-lg font-semibold">Flowmail</span>
              </Link>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Email marketing automation with a visual workflow canvas, drag-and-drop builder and
                real delivery tracking.
              </p>
            </div>

            <FooterCol
              title="Product"
              links={[
                { label: "Automation", to: "/automation" },
                { label: "Autoresponder", to: "/autoresponder" },
                { label: "Contacts", to: "/contacts" },
                { label: "Reports", to: "/reports" },
              ]}
            />
            <FooterCol
              title="Features"
              links={[
                { label: "Workflow canvas", to: "/automation" },
                { label: "Email builder", to: "/automation" },
                { label: "Open & click tracking", to: "/reports" },
                { label: "Emails and domains", to: "/emails-and-domains" },
              ]}
            />
            <FooterCol
              title="Get started"
              links={[
                { label: "Sign in", to: "/auth" },
                { label: "Create account", to: "/auth" },
                { label: "Dashboard", to: "/dashboard" },
              ]}
            />
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Flowmail. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              SPF · DKIM · DMARC verified sending
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; to: string }>;
}) {
  return (
    <div>
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
