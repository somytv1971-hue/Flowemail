import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
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

export type RemoveContactConfig = {
  remove_from?: "lists" | "cycle" | "account" | "current";
  list_id?: string | null;
  list_name?: string | null;
  run_multiple?: boolean;
  tab_color?: string;
};

const SOURCES = [
  { id: "lists", label: "Lists" },
  { id: "cycle", label: "Autoresponder cycle" },
  { id: "account", label: "Entire account" },
  { id: "current", label: "Current list and workflow" },
] as const;

export function removeContactSummary(cfg: RemoveContactConfig) {
  if ((cfg.remove_from ?? "lists") === "lists" && cfg.list_name)
    return `Remove from ${cfg.list_name} list`;
  const src = SOURCES.find((s) => s.id === (cfg.remove_from ?? "lists"));
  return `Remove contact: ${src?.label ?? "Lists"}`;
}

export function WorkflowRemoveContactPanel({
  config,
  onChange,
}: {
  config: RemoveContactConfig;
  onChange: (patch: RemoveContactConfig) => void;
}) {
  const fetchLists = useServerFn(listContactLists);
  const { data: lists = [] } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: () => fetchLists({}),
  });

  const source = config.remove_from ?? "lists";

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <Trash2 className="h-5 w-5 text-primary" />
        <span className="font-display text-base font-semibold">Remove contact</span>
      </div>

      <div className="space-y-2">
        <Label>Where to remove contacts from?</Label>
        <Select value={source} onValueChange={(v) => onChange({ remove_from: v as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {source === "lists" && (
        <div className="space-y-2">
          <Label>List</Label>
          <Select
            value={config.list_id ?? ""}
            onValueChange={(v) => {
              const name = (lists as any[]).find((l) => l.id === v)?.name ?? null;
              onChange({ list_id: v, list_name: name });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a list" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {(lists as any[]).length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">
                  No contact lists yet
                </div>
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
      )}

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
