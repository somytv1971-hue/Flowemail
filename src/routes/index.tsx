import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Mail, Zap, BarChart3, Users, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flowmail — Modern email marketing automation" },
      {
        name: "description",
        content:
          "Design automated email workflows, manage contacts and track campaign results in one focused workspace.",
      },
      { property: "og:title", content: "Flowmail — Modern email marketing automation" },
      {
        property: "og:description",
        content:
          "Design automated email workflows, manage contacts and track campaign results in one focused workspace.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
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
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Email marketing, reimagined
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Automate every email your{" "}
            <span className="bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
              audience deserves
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Build workflows, nurture contacts and measure what matters — without the
            bloat of legacy marketing suites.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Automation", body: "Visual workflows that trigger on behavior, tags and time." },
            { icon: Users, title: "Contacts", body: "Segment your audience with rich, real-time filters." },
            { icon: BarChart3, title: "Reports", body: "See what's converting the moment it happens." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
