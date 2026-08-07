import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listSenderEmails } from "@/lib/sender-emails.functions";

export type SenderEmailOption = {
  id: string;
  email: string;
  name: string;
  status: string;
  is_default: boolean;
};

export function useSenderEmails() {
  const fetchEmails = useServerFn(listSenderEmails);
  const query = useQuery({
    queryKey: ["sender-emails"],
    queryFn: () => fetchEmails({}),
  });
  return { ...query, emails: (query.data ?? []) as SenderEmailOption[] };
}

/**
 * Dropdown of the sender addresses added in profile → Emails and domains.
 * Confirmed addresses are selectable; pending ones are shown but disabled.
 */
export function SenderEmailSelect({
  value,
  onChange,
  className,
  placeholder = "Choose an email address",
}: {
  value?: string | null;
  onChange: (email: string, option?: SenderEmailOption) => void;
  className?: string;
  placeholder?: string;
}) {
  const { emails } = useSenderEmails();
  const known = emails.some((e) => e.email === value);

  return (
    <Select
      value={value && known ? value : undefined}
      onValueChange={(v) => onChange(v, emails.find((e) => e.email === v))}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={value || placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {emails.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            No sender addresses yet.{" "}
            <Link to="/emails-and-domains" className="font-medium text-primary hover:underline">
              Add one
            </Link>
          </div>
        ) : (
          emails.map((e) => (
            <SelectItem key={e.id} value={e.email} disabled={e.status !== "confirmed"}>
              {e.name ? `${e.name} <${e.email}>` : e.email}
              {e.status !== "confirmed" ? " — pending" : ""}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
