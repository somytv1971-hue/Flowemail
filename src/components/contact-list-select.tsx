import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listContactLists } from "@/lib/contacts.functions";

export type ContactListOption = {
  id: string;
  name: string;
  contact_count?: number;
};

export function useContactLists() {
  const fetchLists = useServerFn(listContactLists);
  const query = useQuery({
    queryKey: ["contact-lists"],
    queryFn: () => fetchLists({}),
  });
  return { ...query, lists: (query.data ?? []) as ContactListOption[] };
}

/**
 * Dropdown of the user's real contact lists (with contact counts).
 * `value`/`onChange` work on the list name so it can back plain text columns too.
 */
export function ContactListNameSelect({
  value,
  onChange,
  className,
  placeholder = "Choose a list",
}: {
  value?: string | null;
  onChange: (name: string, list?: ContactListOption) => void;
  className?: string;
  placeholder?: string;
}) {
  const { lists } = useContactLists();
  const known = lists.some((l) => l.name === value);

  return (
    <Select
      value={value && known ? value : undefined}
      onValueChange={(v) => onChange(v, lists.find((l) => l.name === v))}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={value || placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {lists.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">No contact lists yet</div>
        ) : (
          lists.map((l) => (
            <SelectItem key={l.id} value={l.name}>
              {l.name}
              {typeof l.contact_count === "number" ? ` (${l.contact_count})` : ""}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

/** Dropdown of real contact lists keyed by list id. */
export function ContactListSelect({
  value,
  onChange,
  className,
  placeholder = "Choose a list",
}: {
  value?: string | null;
  onChange: (id: string, list?: ContactListOption) => void;
  className?: string;
  placeholder?: string;
}) {
  const { lists } = useContactLists();

  return (
    <Select
      value={value ?? undefined}
      onValueChange={(v) => onChange(v, lists.find((l) => l.id === v))}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {lists.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">No contact lists yet</div>
        ) : (
          lists.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name}
              {typeof l.contact_count === "number" ? ` (${l.contact_count})` : ""}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
