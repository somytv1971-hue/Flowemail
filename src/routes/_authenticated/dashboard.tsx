import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Users, BarChart3, Send, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Flowmail" },
      { name: "description", content: "Your Flowmail workspace overview." },
      { property: "og:title", content: "Dashboard — Flowmail" },
      { property: "og:description", content: "Your Flowmail workspace overview." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const tiles = [
    { to: "/automation", icon: Zap, title: "Automation", desc: "Build workflows that run themselves" },
    { to: "/autoresponder", icon: Send, title: "Autoresponder", desc: "Sequential emails on any trigger" },
    { to: "/contacts", icon: Users, title: "Contacts", desc: "Segment and manage your audience" },
    { to: "/reports", icon: BarChart3, title: "Reports", desc: "Deliverability and engagement" },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-muted-foreground">Pick up where you left off.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {tiles.map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-lg font-semibold">{title}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
