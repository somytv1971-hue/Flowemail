import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRightLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listContactLists } from "@/lib/contacts.functions";
import { TAB_COLORS } from "@/components/workflow-subscribe-panel";

export type MoveToListConfig = {
  target_list_id?: string | null;
  target_list_name?: string | null;
  cycle_day?: string;
  run_multiple?: boolean;
  tab_color?: string;
};

export function moveToListSummary(cfg: MoveToListConfig) {
  return cfg.target_list_name
    ? `Move to list "${cfg.target_list_name}"`
    : "Move to list";
}

const CYCLE_DAYS = Array.from({ length: 31 }, (_, i) => `Day ${i}`);

export function WorkflowMoveToListPanel({
  config,
  onChange,
}: {
  config: MoveToListConfig;
  onChange: (patch: MoveToListConfig) => void;
}) {
  const fetchLists = useServerFn(listContactLists);
  const { data: lists = [] } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: () => fetchLists({}),
  });

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <ArrowRightLeft className="h-5 w-5 text-primary" />
        <span className="font-display text-base font-semibold">Move to list</span>
      </div>

      <div className="space-y-2">
        <Label>What&apos;s the target list?</Label>
        <Select
          value={config.target_list_id ?? ""}
          onValueChange={(v) => {
            const name = (lists as any[]).find((l) => l.id === v)?.name ?? null;
            onChange({ target_list_id: v, target_list_name: name });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a list" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {(lists as any[]).length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">No contact lists yet</div>
            ) : (
              (lists as any[]).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                  {typeof l.contact_count === "number" ? ` (${l.contact_count})` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Autoresponder cycle</Label>
        <Select
          value={config.cycle_day ?? "Day 0"}
          onValueChange={(v) => onChange({ cycle_day: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {CYCLE_DAYS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
