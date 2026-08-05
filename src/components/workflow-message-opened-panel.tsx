import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MailOpen, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAutomationMessages } from "@/lib/automation-messages.functions";
import { TAB_COLORS } from "@/components/workflow-subscribe-panel";

export const MESSAGE_OPEN_SOURCES = [
  { id: "any", label: "Any" },
  { id: "newsletter", label: "Newsletter" },
  { id: "autoresponder", label: "Autoresponder" },
  { id: "ab_test", label: "A/B test" },
  { id: "automation", label: "Automation" },
];

export type MessageOpenedConfig = {
  source?: string;
  scope?: "any" | "specific";
  message_id?: string | null;
  message_name?: string | null;
  run_multiple?: boolean;
  wait_mode?: "never" | "after_time";
  days?: number;
  hours?: number;
  minutes?: number;
  tab_color?: string;
};

export function messageOpenedSummary(cfg: MessageOpenedConfig) {
  const src =
    MESSAGE_OPEN_SOURCES.find((s) => s.id === (cfg.source ?? "automation"))?.label ?? "Automation";
  if (cfg.scope === "specific" && cfg.message_name)
    return `When "${cfg.message_name}" is opened`;
  return `When any ${src.toLowerCase()} message is opened`;
}

const NUMS = (n: number) => Array.from({ length: n }, (_, i) => i);

export function WorkflowMessageOpenedPanel({
  config,
  onChange,
}: {
  config: MessageOpenedConfig;
  onChange: (patch: MessageOpenedConfig) => void;
}) {
  const list = useServerFn(listAutomationMessages);
  const { data: messages } = useQuery({
    queryKey: ["automation-messages"],
    queryFn: () => list(),
  });
  const [search, setSearch] = useState("");

  const source = config.source ?? "automation";
  const scope = config.scope ?? "any";
  const waitMode = config.wait_mode ?? "after_time";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (messages ?? []).filter((m: any) => !q || m.name?.toLowerCase().includes(q));
  }, [messages, search]);

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <MailOpen className="h-4 w-4 text-primary" />
        <span className="font-medium">Email was opened</span>
      </div>

      <div>
        <Label className="text-sm">Which message opens do you want to track?</Label>
        <Select value={source} onValueChange={(v) => onChange({ source: v })}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESSAGE_OPEN_SOURCES.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={scope}
          onValueChange={(v) =>
            onChange({ scope: v as "any" | "specific", ...(v === "any" ? { message_id: null, message_name: null } : {}) })
          }
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="specific">Specific</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scope === "specific" && (
        <div>
          <Label className="text-sm">Select a message</Label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages"
              className="pl-8"
            />
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-md border">
            {filtered.length === 0 && (
              <p className="p-3 text-xs text-muted-foreground">No messages found.</p>
            )}
            {filtered.map((m: any) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange({ message_id: m.id, message_name: m.name })}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                  config.message_id === m.id ? "bg-primary/10 font-medium text-primary" : ""
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Switch
          checked={config.run_multiple ?? true}
          onCheckedChange={(v) => onChange({ run_multiple: v })}
        />
        <span className="text-sm">Run multiple times</span>
      </div>

      <div>
        <Label className="text-sm">When to assume the condition wasn't met?</Label>
        <RadioGroup
          value={waitMode}
          onValueChange={(v) => onChange({ wait_mode: v as "never" | "after_time" })}
          className="mt-2 space-y-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="never" id="mo-never" />
            <Label htmlFor="mo-never" className="text-sm font-normal">
              Never (disables "if no" connection)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="after_time" id="mo-after" />
            <Label htmlFor="mo-after" className="text-sm font-normal">
              After some time
            </Label>
          </div>
        </RadioGroup>

        {waitMode === "after_time" && (
          <div className="mt-3 flex items-end gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Days</Label>
              <Input
                type="number"
                min={0}
                value={config.days ?? 1}
                onChange={(e) => onChange({ days: Number(e.target.value) })}
                className="mt-1 w-16"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Hours</Label>
              <Select
                value={String(config.hours ?? 0)}
                onValueChange={(v) => onChange({ hours: Number(v) })}
              >
                <SelectTrigger className="mt-1 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {NUMS(24).map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Minutes</Label>
              <Select
                value={String(config.minutes ?? 0)}
                onValueChange={(v) => onChange({ minutes: Number(v) })}
              >
                <SelectTrigger className="mt-1 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {[0, 5, 10, 15, 20, 30, 45].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="text-sm">Set the tab color for this element</Label>
        <Select
          value={config.tab_color ?? "default"}
          onValueChange={(v) => onChange({ tab_color: v })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAB_COLORS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span className={`h-3 w-6 rounded-sm ${c.swatch}`} />
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
