import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UserRound } from "lucide-react";
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

export const SUBSCRIPTION_METHODS = [
  { id: "any", label: "Any method" },
  { id: "api", label: "API" },
  { id: "form", label: "Form" },
  { id: "contact_import", label: "Contact import" },
  { id: "landing_page", label: "Landing page" },
  { id: "website", label: "Website" },
  { id: "list_email", label: "List email" },
  { id: "added_manually", label: "Added manually" },
  { id: "webinar", label: "Webinar" },
  { id: "copied_from_list", label: "Copied from another list" },
  { id: "moved_from_list", label: "Moved from another list" },
  { id: "integration", label: "Integration" },
];

export const TAB_COLORS = [
  { id: "default", label: "Default", swatch: "bg-primary" },
  { id: "red", label: "Red", swatch: "bg-destructive" },
  { id: "green", label: "Green", swatch: "bg-success" },
  { id: "purple", label: "Purple", swatch: "bg-accent" },
  { id: "brown", label: "Brown", swatch: "bg-warning" },
  { id: "yellow", label: "Yellow", swatch: "bg-warning" },
  { id: "light_green", label: "Light Green", swatch: "bg-success/60" },
  { id: "grey", label: "Grey", swatch: "bg-muted-foreground" },
];

export type SubscribeConfig = {
  list_mode?: "any" | "specific";
  list_id?: string | null;
  list_name?: string | null;
  method?: string;
  include_existing?: boolean;
  tab_color?: string;
};

export function subscribeSummary(cfg: SubscribeConfig, listName?: string) {
  const list =
    cfg.list_mode === "specific"
      ? (listName ?? cfg.list_name ?? "a specific list")
      : "any list";
  const method =
    SUBSCRIPTION_METHODS.find((m) => m.id === (cfg.method ?? "any"))?.label ?? "Any method";
  return `Subscribed to ${list} via ${method.toLowerCase()}`;
}

export function WorkflowSubscribePanel({
  config,
  onChange,
}: {
  config: SubscribeConfig;
  onChange: (patch: SubscribeConfig) => void;
}) {
  const fetchLists = useServerFn(listContactLists);
  const { data: lists = [] } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: () => fetchLists({}),
  });

  const listMode = config.list_mode ?? "any";

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <UserRound className="h-5 w-5 text-primary" />
        <span className="font-display text-base font-semibold">Subscribe</span>
      </div>

      <div className="space-y-2">
        <Label>Select the list</Label>
        <Select
          value={listMode}
          onValueChange={(v) => onChange({ list_mode: v as "any" | "specific" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="specific">Specific</SelectItem>
          </SelectContent>
        </Select>

        {listMode === "specific" && (
          <Select
            value={config.list_id ?? ""}
            onValueChange={(v) => onChange({ list_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a list" />
            </SelectTrigger>
            <SelectContent>
              {(lists as any[]).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label>Select the subscription method:</Label>
        <Select
          value={config.method ?? "any"}
          onValueChange={(v) => onChange({ method: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {SUBSCRIPTION_METHODS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-start gap-3">
        <Switch
          checked={config.include_existing ?? false}
          onCheckedChange={(v) => onChange({ include_existing: v })}
        />
        <span className="text-sm text-muted-foreground">
          Include contacts who are already in this list before the workflow starts
        </span>
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

      <a
        href="https://www.getresponse.com/help"
        target="_blank"
        rel="noreferrer"
        className="block pt-4 text-sm text-primary hover:underline"
      >
        Which subscription methods can I select?
      </a>
    </div>
  );
}
