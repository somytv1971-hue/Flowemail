import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  MoreVertical,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSenderEmails,
  addSenderEmail,
  resendSenderConfirmation,
  deleteSenderEmail,
  setDefaultSenderEmail,
} from "@/lib/sender-emails.functions";



export const Route = createFileRoute("/_authenticated/emails-and-domains")({
  head: () => ({
    meta: [
      { title: "Emails and domains — Flowmail" },
      {
        name: "description",
        content: "Manage sender email addresses, domain authentication, SPF, DKIM and DMARC.",
      },
      { property: "og:title", content: "Emails and domains — Flowmail" },
      {
        property: "og:description",
        content: "Manage sender email addresses and authenticate your sending domains.",
      },
    ],
  }),
  component: Page,
});

type Address = {
  id: string;
  name: string;
  email: string;
  purpose: "Default" | "";
  status: "Confirmed" | "Pending";
};

type DomainRow = {
  id: string;
  domain: string;
  spf: "Added" | "Missing";
  dmarc: "Added" | "Missing";
  dkim: "DKIM-authenticated" | "At risk";
  addresses: Address[];
};

function Page() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"emails" | "domains">("emails");
  const [showBanner, setShowBanner] = useState(true);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);

  const { data: senders = [] } = useQuery({
    queryKey: ["sender-emails"],
    queryFn: () => listSenderEmails(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sender-emails"] });

  const rows: DomainRow[] = useMemo(() => {
    const map = new Map<string, DomainRow>();
    for (const s of senders) {
      const domain = s.email.split("@")[1]?.toLowerCase() ?? "";
      const isFree = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"].includes(domain);
      if (!map.has(domain)) {
        map.set(domain, {
          id: domain,
          domain,
          spf: isFree ? "Added" : "Missing",
          dmarc: isFree ? "Added" : "Missing",
          dkim: isFree ? "At risk" : "DKIM-authenticated",
          addresses: [],
        });
      }
      map.get(domain)!.addresses.push({
        id: s.id,
        name: s.name || s.email.split("@")[0],
        email: s.email,
        purpose: s.is_default ? "Default" : "",
        status: s.status === "confirmed" ? "Confirmed" : "Pending",
      });
    }
    return [...map.values()];
  }, [senders]);

  const addMutation = useMutation({
    mutationFn: (vars: { name: string; email: string }) =>
      addSenderEmail({ data: { email: vars.email, name: vars.name } }),
    onSuccess: (res, vars) => {
      invalidate();
      setExpanded((e) =>
        e.includes(vars.email.split("@")[1] ?? "") ? e : [...e, vars.email.split("@")[1] ?? ""],
      );
      if (res.sent) {
        toast.success("Confirmation email sent", {
          description: `Check ${vars.email} and click the link to confirm it.`,
        });
      } else {
        toast.warning("Email not delivered", {
          description: `${vars.email} is blocked from receiving mail (previous bounce or unsubscribe).`,
        });
      }
    },
    onError: (error: unknown) =>
      toast.error("Couldn't add the address", {
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      }),
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => resendSenderConfirmation({ data: { id } }),
    onSuccess: () => toast.success("Confirmation email sent again"),
    onError: (error: unknown) =>
      toast.error("Couldn't resend the confirmation", {
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSenderEmail({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Email address removed");
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultSenderEmail({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Default sender updated");
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows
      .map((r) => ({
        ...r,
        addresses: r.addresses.filter(
          (a) => a.email.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
        ),
      }))
      .filter((r) => r.domain.toLowerCase().includes(q) || r.addresses.length > 0);
  }, [rows, query]);

  const toggle = (id: string) =>
    setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  const addEmail = (name: string, email: string) => addMutation.mutate({ name, email });


  const removeAddress = (domainId: string, addressId: string) => {
    setRows((prev) =>
      prev
        .map((r) =>
          r.id === domainId
            ? { ...r, addresses: r.addresses.filter((a) => a.id !== addressId) }
            : r,
        )
        .filter((r) => r.addresses.length > 0),
    );
    toast.success("Email address removed");
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex gap-8 border-b">
        <TabButton active={tab === "emails"} onClick={() => setTab("emails")}>
          Email addresses
        </TabButton>
        <TabButton active={tab === "domains"} onClick={() => setTab("domains")}>
          Website and landing page domains
        </TabButton>
      </div>

      {tab === "domains" ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Mail className="h-6 w-6" />
          </div>
          <div className="font-display text-lg font-semibold">No domains connected yet</div>
          <p className="max-w-md text-sm text-muted-foreground">
            Connect a domain to publish websites and landing pages on your own brand.
          </p>
          <Button className="mt-2">Connect domain</Button>
        </div>
      ) : (
        <>
          {showBanner && (
            <div className="relative mt-6 flex gap-4 rounded-xl border bg-muted/40 p-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div className="pr-8 text-sm text-muted-foreground">
                <h2 className="font-semibold text-foreground">
                  Set up an email address at your own domain
                </h2>
                <p className="mt-1">
                  Here, you can add and manage the email addresses that appear in your emails'
                  "From" section. To reach your recipients' inboxes, switch to a custom domain and{" "}
                  <a className="text-primary underline-offset-2 hover:underline" href="#dkim">
                    authenticate it with DKIM
                  </a>
                  . To protect your domain from spoofing,{" "}
                  <a className="text-primary underline-offset-2 hover:underline" href="#dmarc">
                    add a DMARC policy
                  </a>
                  .
                </p>
                <p className="mt-3">
                  If you already have a custom domain, click <strong>Add email</strong> and then
                  follow the steps to authenticate your domain. If you use a free email address,
                  upgrade to a paid plan to buy a domain from us. We'll handle the authentication
                  process.
                </p>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                aria-label="Dismiss"
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="rounded-full pl-9"
              />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Button variant="outline" className="rounded-full" onClick={() => setAliasOpen(true)}>
                Create email alias
              </Button>
              <Button className="rounded-full font-semibold" onClick={() => setAddOpen(true)}>
                Add email
              </Button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="py-3 pr-4">Email domain name</th>
                  <th className="px-4 py-3 text-center">SPF</th>
                  <th className="px-4 py-3 text-center">DMARC</th>
                  <th className="px-4 py-3 text-center">DKIM</th>
                  <th className="py-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      No email addresses match "{query}".
                    </td>
                  </tr>
                )}
                {filtered.map((row) => {
                  const open = expanded.includes(row.id);
                  return (
                    <Fragment key={row.id}>
                      <tr className="border-b">
                        <td className="py-4 pr-4">
                          <button
                            onClick={() => toggle(row.id)}
                            className="inline-flex items-center gap-1 font-semibold"
                          >
                            {row.domain}{" "}
                            <span className="font-normal text-muted-foreground">
                              ({row.addresses.length})
                            </span>
                            {open ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1">
                            {row.spf}
                            {row.spf === "Added" ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            ) : null}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1">
                            {row.dmarc}
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center gap-1">
                            <Badge
                              className={
                                row.dkim === "At risk"
                                  ? "rounded-full bg-amber-500 text-white hover:bg-amber-500"
                                  : "rounded-full bg-emerald-600 text-white hover:bg-emerald-600"
                              }
                            >
                              {row.dkim}
                            </Badge>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-right">
                          {row.dkim === "At risk" ? (
                            <button className="font-semibold text-foreground hover:text-primary">
                              Learn more
                            </button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toggle(row.id)}>
                                  {open ? "Hide addresses" : "Show addresses"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAddOpen(true)}>
                                  Add email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b bg-muted/40">
                          <td colSpan={5} className="p-4">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                                  <th className="py-2 pr-4">Name</th>
                                  <th className="px-4 py-2">Email address</th>
                                  <th className="px-4 py-2">Purpose</th>
                                  <th className="px-4 py-2">Email address status</th>
                                  <th className="py-2 pl-4" />
                                </tr>
                              </thead>
                              <tbody>
                                {row.addresses.map((a) => (
                                  <tr key={a.id}>
                                    <td className="py-3 pr-4 font-semibold">{a.name}</td>
                                    <td className="px-4 py-3">{a.email}</td>
                                    <td className="px-4 py-3">
                                      {a.purpose === "Default" ? (
                                        <Badge variant="outline" className="rounded-full">
                                          Default
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 font-semibold">{a.status}</td>
                                    <td className="py-3 pl-4 text-right">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() => setDefault(row.id, a.id)}
                                          >
                                            Set as default
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              void sendConfirmation(a.email, a.name)
                                            }
                                          >
                                            Resend confirmation
                                          </DropdownMenuItem>

                                          <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => removeAddress(row.id, a.id)}
                                          >
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <a
            href="#dkim"
            className="mt-6 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            Learn why having a custom domain and authenticating it helps deliverability
          </a>
        </>
      )}

      <EmailDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add email"
        description="We'll send a confirmation link to this address before you can send from it."
        onSubmit={addEmail}
      />
      <EmailDialog
        open={aliasOpen}
        onOpenChange={setAliasOpen}
        title="Create email alias"
        description="An alias lets replies land in a different inbox than the sending address."
        onSubmit={(name, email) => {
          addEmail(name, email);
        }}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmailDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onSubmit: (name: string, email: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    onSubmit(name.trim() || email.split("@")[0], email.trim().toLowerCase());
    setName("");
    setEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sender-name">Sender name</Label>
            <Input
              id="sender-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tangail Model"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sender-email">Email address</Label>
            <Input
              id="sender-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourdomain.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>{title}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
