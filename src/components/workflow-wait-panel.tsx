import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TAB_COLORS } from "@/components/workflow-subscribe-panel";

export type WaitConfig = {
  wait_type?: "for" | "until" | "specific" | "nth_day";
  wait_days?: number;
  wait_hours?: number;
  wait_minutes?: number;
  wait_weekdays?: string[];
  wait_time?: string;
  wait_date?: string;
  wait_nth?: number;
  time_travel?: boolean;
  run_multiple?: boolean;
  tab_color?: string;
};

const WAIT_TYPES = [
  { id: "for", label: "Wait for" },
  { id: "until", label: "Wait until" },
  { id: "specific", label: "Wait until a specific day and time" },
  { id: "nth_day", label: "Wait until the nth day of a month" },
] as const;

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 30, 45];

export function waitSummary(cfg: WaitConfig) {
  const type = cfg.wait_type ?? "for";
  if (type === "for") {
    const d = cfg.wait_days ?? 1;
    const h = cfg.wait_hours ?? 0;
    const m = cfg.wait_minutes ?? 0;
    const parts: string[] = [];
    if (d) parts.push(`${d} day${d > 1 ? "s" : ""}`);
    if (h) parts.push(`${h} hr`);
    if (m) parts.push(`${m} min`);
    return `Wait for ${parts.length ? parts.join(" ") : "0 min"}`;
  }
  if (type === "until") return `Wait until ${cfg.wait_time ?? "09:00"}`;
  if (type === "specific")
    return `Wait until ${cfg.wait_date ?? "a specific day"} ${cfg.wait_time ?? ""}`.trim();
  return `Wait until day ${cfg.wait_nth ?? 1} of the month`;
}

export function WorkflowWaitPanel({
  config,
  onChange,
}: {
  config: WaitConfig;
  onChange: (patch: WaitConfig) => void;
}) {
  const type = config.wait_type ?? "for";
  const days = config.wait_weekdays ?? WEEKDAYS;

  const toggleDay = (day: string) => {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    onChange({ wait_weekdays: WEEKDAYS.filter((d) => next.includes(d)) });
  };

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <Clock className="h-5 w-5 text-primary" />
        <span className="font-display text-base font-semibold">Wait</span>
      </div>

      <div className="space-y-2">
        <Label>How to delay the next action?</Label>
        <Select value={type} onValueChange={(v) => onChange({ wait_type: v as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WAIT_TYPES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === "for" && (
        <div className="flex items-end gap-2">
          <div className="w-20 space-y-1">
            <Label className="text-xs">Days</Label>
            <Input
              type="number"
              min={0}
              value={config.wait_days ?? 1}
              onChange={(e) => onChange({ wait_days: Number(e.target.value) })}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Hours</Label>
            <Select
              value={String(config.wait_hours ?? 0)}
              onValueChange={(v) => onChange({ wait_hours: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Minutes</Label>
            <Select
              value={String(config.wait_minutes ?? 0)}
              onValueChange={(v) => onChange({ wait_minutes: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {(type === "until" || type === "specific" || type === "nth_day") && (
        <div className="grid grid-cols-2 gap-2">
          {type === "specific" && (
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={config.wait_date ?? ""}
                onChange={(e) => onChange({ wait_date: e.target.value })}
              />
            </div>
          )}
          {type === "nth_day" && (
            <div className="space-y-1">
              <Label className="text-xs">Day of month</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={config.wait_nth ?? 1}
                onChange={(e) => onChange({ wait_nth: Number(e.target.value) })}
              />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Time</Label>
            <Input
              type="time"
              value={config.wait_time ?? "09:00"}
              onChange={(e) => onChange({ wait_time: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>After the wait, the next step occurs on:</Label>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((d) => {
            const active = days.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {d.slice(0, 3)}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {days.length ? days.join(", ") : "No days selected"}
        </p>
      </div>

      <div className="flex items-center gap-3 opacity-60">
        <Switch
          checked={config.time_travel ?? false}
          onCheckedChange={(v) => onChange({ time_travel: v })}
          disabled
        />
        <span className="text-sm">Time travel</span>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={config.run_multiple ?? true}
          onCheckedChange={(v) => onChange({ run_multiple: v })}
        />
        <span className="text-sm">Run multiple times</span>
      </div>

      <div className="space-y-2">
        <Label>Set the tab color for this element</Label>
        <Select
          value={config.tab_color ?? "default"}
          onValueChange={(v) => onChange({ tab_color: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {TAB_COLORS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span className={`h-3.5 w-5 rounded-sm ${c.swatch}`} />
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
