import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Flowmail" },
      { name: "description", content: "Manage and segment your contacts." },
      { property: "og:title", content: "Contacts — Flowmail" },
      { property: "og:description", content: "Manage and segment your contacts." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Contacts</h1>
      <p className="mt-1 text-muted-foreground">Import, tag and segment your audience.</p>
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border bg-card p-16 text-center shadow-sm">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Users className="h-6 w-6" />
        </div>
        <div className="font-display text-lg font-semibold">Coming soon</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Contact lists and segmentation land in the next milestone.
        </p>
      </div>
    </div>
  );
}
