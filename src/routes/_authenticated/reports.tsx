import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, MailCheck, MousePointerClick, Eye, Users, Activity } from "lucide-react";
import { getReportSummary } from "@/lib/reports.functions";
import { Skeleton } from "@/components/ui/skeleton";

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

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Eye;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function Page() {
  const fetchSummary = useServerFn(getReportSummary);
  const { data, isLoading } = useQuery({
    queryKey: ["report-summary", 30],
    queryFn: () => fetchSummary({ data: { days: 30 } }),
    refetchInterval: 30_000,
  });

  const peak = Math.max(1, ...(data?.daily ?? []).map((d) => d.sent));

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Reports</h1>
      <p className="mt-1 text-muted-foreground">
        Deliverability, opens and clicks from the last 30 days.
      </p>

      {isLoading || !data ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={MailCheck}
              label="Emails sent"
              value={data.sent}
              hint={data.failed ? `${data.failed} not delivered` : "All delivered"}
            />
            <Stat icon={Eye} label="Open rate" value={`${data.openRate}%`} hint={`${data.opened} opens`} />
            <Stat
              icon={MousePointerClick}
              label="Click rate"
              value={`${data.clickRate}%`}
              hint={`${data.clicked} clicks`}
            />
            <Stat
              icon={Users}
              label="Contacts"
              value={data.contacts}
              hint={`${data.lists} list${data.lists === 1 ? "" : "s"}`}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Stat icon={Activity} label="Automations in progress" value={data.activeRuns} />
            <Stat icon={BarChart3} label="Automations completed" value={data.completedRuns} />
          </div>

          <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="font-display text-lg font-semibold">Sending activity</div>
            <div className="mt-6 flex h-40 items-end gap-1">
              {data.daily.map((d) => (
                <div key={d.date} className="group relative flex-1">
                  <div
                    className="w-full rounded-t bg-primary/20"
                    style={{ height: `${(d.sent / peak) * 140}px` }}
                  >
                    <div
                      className="w-full rounded-t bg-primary"
                      style={{ height: `${(d.opened / peak) * 140}px` }}
                    />
                  </div>
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-md group-hover:block">
                    {d.date}: {d.sent} sent · {d.opened} opened · {d.clicked} clicked
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary/30" /> Sent
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" /> Opened
              </span>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4 font-display text-lg font-semibold">
              Recent emails
            </div>
            {data.recent.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No emails sent yet. Add contacts to a list used by a published workflow, or send an
                automation message to a list.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Recipient</th>
                    <th className="px-6 py-3 font-medium">Subject</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Engagement</th>
                    <th className="px-6 py-3 font-medium">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-6 py-3">{r.email}</td>
                      <td className="px-6 py-3 text-muted-foreground">{r.subject || "—"}</td>
                      <td className="px-6 py-3 capitalize">{r.status}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {r.clicked ? "Clicked" : r.opened ? "Opened" : "—"}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
