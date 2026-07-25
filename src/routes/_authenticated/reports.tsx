import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Flowmail" },
      { name: "description", content: "Track email marketing performance." },
      { property: "og:title", content: "Reports — Flowmail" },
      { property: "og:description", content: "Track email marketing performance." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Reports</h1>
      <p className="mt-1 text-muted-foreground">Deliverability, opens, clicks and conversions.</p>
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border bg-card p-16 text-center shadow-sm">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div className="font-display text-lg font-semibold">Coming soon</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Full campaign reports launch after we ship contact segments.
        </p>
      </div>
    </div>
  );
}
