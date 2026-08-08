import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import {
  MailCheck,
  MailX,
  Eye,
  EyeOff,
  ArrowRightLeft,
  UserMinus,
  Activity,
} from "lucide-react";
import { listWorkflowEvents } from "@/lib/reports.functions";
import { Skeleton } from "@/components/ui/skeleton";

const META: Record<string, { icon: typeof Eye; label: string; tone: string }> = {
  message_sent: { icon: MailCheck, label: "Message sent", tone: "text-success" },
  message_failed: { icon: MailX, label: "Message failed", tone: "text-destructive" },
  condition_yes: { icon: Eye, label: "Message opened", tone: "text-success" },
  condition_no: { icon: EyeOff, label: "Not opened", tone: "text-muted-foreground" },
  moved_to_list: { icon: ArrowRightLeft, label: "Moved to list", tone: "text-primary" },
  copied_to_list: { icon: ArrowRightLeft, label: "Copied to list", tone: "text-primary" },
  contact_removed: { icon: UserMinus, label: "Contact removed", tone: "text-destructive" },
  skipped: { icon: Activity, label: "Step skipped", tone: "text-muted-foreground" },
};

export function AutomationEventsTab() {
  const fetchEvents = useServerFn(listWorkflowEvents);
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["workflow-events"],
    queryFn: () => fetchEvents({ data: { limit: 100 } }),
    refetchInterval: 20_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
        <h3 className="font-display text-lg font-semibold">No events yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Events appear here as contacts move through your published workflows.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Detail</th>
            <th className="px-4 py-3">When</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e: any) => {
            const meta = META[e.type] ?? { icon: Activity, label: e.type, tone: "text-foreground" };
            const Icon = meta.icon;
            return (
              <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-2 font-medium ${meta.tone}`}>
                    <Icon className="h-4 w-4" /> {meta.label}
                  </span>
                </td>
                <td className="px-4 py-3">{e.email ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.detail || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
