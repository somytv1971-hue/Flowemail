import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Mail, Image as ImageIcon, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAutomationMessages } from "@/lib/automation-messages.functions";

export const MESSAGE_LAYOUT_SOURCES = [
  { id: "newsletter", label: "Newsletter" },
  { id: "draft", label: "Draft" },
  { id: "autoresponder", label: "Autoresponder" },
  { id: "ab_test", label: "A/B test" },
  { id: "automation", label: "Automation" },
];

export type SendMessageConfig = {
  layout_source?: string;
  message_id?: string | null;
  message_name?: string | null;
};

export function sendMessageSummary(cfg: SendMessageConfig) {
  return `Send message: ${cfg.message_name ?? "Select a message"}`;
}

export function WorkflowSendMessagePanel({
  config,
  onChange,
}: {
  config: SendMessageConfig;
  onChange: (patch: SendMessageConfig) => void;
}) {
  const list = useServerFn(listAutomationMessages);
  const { data: messages } = useQuery({
    queryKey: ["automation-messages"],
    queryFn: () => list(),
  });
  const [search, setSearch] = useState("");

  const source = config.layout_source ?? "automation";
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (messages ?? []).filter((m: any) => !q || m.name?.toLowerCase().includes(q));
  }, [messages, search]);

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <Mail className="h-4 w-4 text-primary" />
        <span className="font-medium">Send message</span>
      </div>

      <div>
        <Label className="text-sm">Use message layout from:</Label>
        <Select
          value={source}
          onValueChange={(v) => onChange({ layout_source: v })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESSAGE_LAYOUT_SOURCES.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Select
          value={config.message_id ?? ""}
          onValueChange={(v) => {
            const m = (messages ?? []).find((x: any) => x.id === v);
            onChange({ message_id: v, message_name: m?.name ?? null });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a message" />
          </SelectTrigger>
          <SelectContent>
            <div className="p-1.5">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Search..."
                  className="h-8 pl-7"
                />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No messages found</div>
            ) : (
              filtered.map((m: any) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full rounded-full" asChild>
        <Link to="/automation">Create a new message</Link>
      </Button>

      <div className="border-t pt-4">
        <Label className="text-sm">Your message:</Label>
        <div className="mt-2 rounded-lg border bg-background p-4">
          <div className="grid h-28 place-items-center rounded bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-2 rounded bg-muted" />
            <div className="h-2 w-5/6 rounded bg-muted" />
            <div className="h-2 w-4/6 rounded bg-muted" />
            <div className="h-2 w-3/6 rounded bg-muted" />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {config.message_name ?? "No message selected"}
          </p>
        </div>
        {config.message_id && (
          <Button variant="outline" className="mt-3 w-full rounded-full" asChild>
            <Link to="/automation/messages/$id" params={{ id: config.message_id }}>
              Edit message
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
