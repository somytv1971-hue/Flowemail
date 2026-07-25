import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/autoresponder")({
  head: () => ({
    meta: [
      { title: "Autoresponder — Flowmail" },
      { name: "description", content: "Trigger sequential emails automatically." },
      { property: "og:title", content: "Autoresponder — Flowmail" },
      { property: "og:description", content: "Trigger sequential emails automatically." },
    ],
  }),
  component: () => <Placeholder title="Autoresponder" icon={Send} desc="Design sequential email drips triggered by signups, tags or dates." />,
});

function Placeholder({ title, icon: Icon, desc }: { title: string; icon: React.ComponentType<{className?: string}>; desc: string }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-1 text-muted-foreground">{desc}</p>
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border bg-card p-16 text-center shadow-sm">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <div className="font-display text-lg font-semibold">Coming soon</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          We're wiring this module up next. Your workflows already run in Automation.
        </p>
      </div>
    </div>
  );
}
