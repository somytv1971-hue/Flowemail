import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Users,
  MoreVertical,
  Trash2,
  Mail,
  Upload,
  ArrowUpDown,
  UserPlus,
  FileText,
  RefreshCw,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listContactLists,
  createContactList,
  deleteContactList,
  listContacts,
  addContact,
  addContactsBulk,
  deleteContact,
  updateContactStatus,
} from "@/lib/contacts.functions";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Flowmail" },
      { name: "description", content: "Create lists, add contacts and manage your audience." },
      { property: "og:title", content: "Contacts — Flowmail" },
      {
        property: "og:description",
        content: "Create lists, add contacts and manage your audience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const TABS = [
  "Lists",
  "Search",
  "Segments",
  "Reports",
  "List hygiene",
  "Suppression lists",
  "Custom fields",
  "Import statistics",
  "Tags",
] as const;

function Page() {
  const qc = useQueryClient();
  const fetchLists = useServerFn(listContactLists);
  const fetchContacts = useServerFn(listContacts);

  const listsQ = useQuery({ queryKey: ["contact-lists"], queryFn: () => fetchLists() });
  const contactsQ = useQuery({
    queryKey: ["contacts"],
    queryFn: () => fetchContacts({ data: {} }),
  });

  const [tab, setTab] = useState<string>("Lists");
  const [listSearch, setListSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);

  const [openList, setOpenList] = useState(false);
  const [openContacts, setOpenContacts] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["contact-lists"] });
    qc.invalidateQueries({ queryKey: ["contacts"] });
  };

  const lists = listsQ.data ?? [];
  const contacts = contactsQ.data ?? [];

  const visibleLists = useMemo(() => {
    const f = lists.filter((l) => l.name.toLowerCase().includes(listSearch.toLowerCase()));
    return [...f].sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  }, [lists, listSearch, sortAsc]);

  const delList = useMutation({
    mutationFn: (id: string) => deleteContactList({ data: { id } }),
    onSuccess: () => {
      toast.success("List deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delContact = useMutation({
    mutationFn: (id: string) => deleteContact({ data: { id } }),
    onSuccess: () => {
      toast.success("Contact removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: "subscribed" | "unsubscribed" | "bounced" }) =>
      updateContactStatus({ data: v }),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const limit = 500;
  const used = Math.min(contacts.length, limit);
  const pct = Math.round((used / limit) * 100);

  return (
    <div>
      <h1 className="sr-only">Contacts</h1>
      <div className="rounded-2xl border bg-card shadow-sm">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto border-b px-4">
            <TabsList className="h-auto justify-start gap-1 bg-transparent p-0">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="relative rounded-none border-b-2 border-transparent px-4 py-4 text-sm font-semibold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  {t}
                  {t === "Segments" && (
                    <Badge className="ml-2 h-4 rounded-full px-1.5 text-[10px]">BETA</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="Lists" className="m-0 p-6">
            <div className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
              {used >= limit ? (
                <>You've reached the {limit}-contact limit.</>
              ) : (
                <>
                  {used} of {limit} contacts used on your plan.
                </>
              )}
            </div>
            <div className="mx-auto mt-3 max-w-2xl">
              <div className="relative h-3 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
                <span className="absolute -top-1 right-0 translate-x-1/4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {used}
                </span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search lists by name"
                  className="rounded-full pl-9"
                />
              </div>
              <div className="ml-auto flex gap-3">
                <Button className="rounded-full" onClick={() => setOpenList(true)}>
                  <Plus className="mr-1 h-4 w-4" /> Create list
                </Button>
                <Button
                  className="rounded-full"
                  variant="secondary"
                  onClick={() => {
                    if (lists.length === 0) {
                      toast.error("Create a list first");
                      setOpenList(true);
                      return;
                    }
                    setOpenContacts(true);
                  }}
                >
                  <Upload className="mr-1 h-4 w-4" /> Add contacts
                </Button>
              </div>
            </div>

            <div className="mt-3 text-right">
              <button
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setTab("Search")}
              >
                {`Show all contacts (${contacts.length})`}
              </button>
            </div>


            {(
              <div className="mt-4 overflow-hidden rounded-xl border">

                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        <button
                          className="inline-flex items-center gap-1"
                          onClick={() => setSortAsc((v) => !v)}
                        >
                          Name <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Created on</th>
                      <th className="px-4 py-3 text-right font-medium">Number of contacts</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {listsQ.isLoading && (
                      <tr>
                        <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!listsQ.isLoading && visibleLists.length === 0 && (
                      <tr>
                        <td className="px-4 py-10 text-center text-muted-foreground" colSpan={4}>
                          No lists yet — create your first one.
                        </td>
                      </tr>
                    )}
                    {visibleLists.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="px-4 py-4 font-semibold">
                          {l.name}
                          {l.is_default && (
                            <span className="ml-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Default
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {new Date(l.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-4 text-right">{l.contact_count}</td>
                        <td className="px-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setOpenContacts(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" /> Add contacts
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => delList.mutate(l.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete list
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="Search" className="m-0 p-6">
            <div className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
              {used >= limit ? (
                <>
                  You've reached the {limit}-contact limit. To add more,{" "}
                  <span className="font-medium text-primary">upgrade your account</span>
                </>
              ) : (
                <>
                  {used} of {limit} contacts used on your plan.
                </>
              )}
            </div>
            <div className="mx-auto mt-3 max-w-2xl">
              <div className="relative h-3 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
                <span className="absolute -top-1 right-0 translate-x-1/4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {used}
                </span>
              </div>
            </div>
            <div className="mt-8">
              <ContactsTable
                contacts={contacts}
                lists={lists}
                search={contactSearch}
                onSearch={setContactSearch}
                onDelete={(id) => delContact.mutate(id)}
                onStatus={(id, status) => setStatus.mutate({ id, status })}
              />
            </div>
          </TabsContent>


          <TabsContent value="Reports" className="m-0 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Total contacts" value={contacts.length} />
              <Stat
                label="Subscribed"
                value={contacts.filter((c) => c.status === "subscribed").length}
              />
              <Stat
                label="Unsubscribed"
                value={contacts.filter((c) => c.status === "unsubscribed").length}
              />
            </div>
          </TabsContent>

          <TabsContent value="Tags" className="m-0 p-6">
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(contacts.flatMap((c) => c.tags ?? []))).map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
              {contacts.flatMap((c) => c.tags ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No tags yet — add tags while creating a contact.
                </p>
              )}
            </div>
          </TabsContent>

          {["Segments", "List hygiene", "Suppression lists", "Custom fields", "Import statistics"].map(
            (t) => (
              <TabsContent key={t} value={t} className="m-0 p-6">
                <Placeholder title={t} />
              </TabsContent>
            ),
          )}
        </Tabs>
      </div>

      <CreateListDialog open={openList} onOpenChange={setOpenList} onDone={invalidate} />
      <AddContactsDialog
        open={openContacts}
        onOpenChange={setOpenContacts}
        lists={lists}
        onDone={invalidate}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Users className="h-6 w-6" />
      </div>
      <div className="font-display text-lg font-semibold">{title}</div>
      <p className="max-w-sm text-sm text-muted-foreground">This section is coming soon.</p>
    </div>
  );
}

type ContactRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  tags: string[] | null;
  list_id: string | null;
  created_at: string;
};

function ContactsTable({
  contacts,
  lists,
  search,
  onSearch,
  onDelete,
  onStatus,
}: {
  contacts: ContactRow[];
  lists: { id: string; name: string }[];
  search: string;
  onSearch: (v: string) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, status: "subscribed" | "unsubscribed" | "bounced") => void;
}) {
  const [sortKey, setSortKey] = useState<"email" | "name" | "created_at">("created_at");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [advanced, setAdvanced] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [listFilter, setListFilter] = useState<string>("all");

  const q = search.toLowerCase();
  const filtered = useMemo(() => {
    const rows = contacts.filter((c) => {
      const matches =
        c.email.toLowerCase().includes(q) ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q);
      const st = statusFilter === "all" || c.status === statusFilter;
      const li = listFilter === "all" || c.list_id === listFilter;
      return matches && st && li;
    });
    return [...rows].sort((a, b) => {
      const va =
        sortKey === "email"
          ? a.email
          : sortKey === "name"
            ? `${a.first_name} ${a.last_name}`.trim()
            : a.created_at;
      const vb =
        sortKey === "email"
          ? b.email
          : sortKey === "name"
            ? `${b.first_name} ${b.last_name}`.trim()
            : b.created_at;
      return asc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [contacts, q, statusFilter, listFilter, sortKey, asc]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * perPage, current * perPage);
  const inactive = contacts.filter((c) => c.status !== "subscribed").length;
  const listName = (id: string | null) => lists.find((l) => l.id === id)?.name ?? "—";

  const toggleSort = (key: "email" | "name" | "created_at") => {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };

  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = () =>
    setSelected(allChecked ? [] : Array.from(new Set([...selected, ...rows.map((r) => r.id)])));
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const fmt = (v: string) =>
    new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p <= 7 || p === pageCount,
  );

  return (
    <div>
      <div className="mx-auto w-full max-w-xl">
        <div className="relative">
          <Input
            value={search}
            onChange={(e) => {
              onSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search contacts by name or email"
            className="h-12 rounded-full pl-6 pr-12"
          />
          <Search className="absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="mt-3 text-center">
          <button
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => setAdvanced((v) => !v)}
          >
            Advanced search
          </button>
        </div>
      </div>

      {advanced && (
        <div className="mx-auto mt-4 grid w-full max-w-xl gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Status</Label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">List</Label>
            <select
              value={listFilter}
              onChange={(e) => {
                setListFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm"
            >
              <option value="all">All lists</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start justify-end">
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm text-muted-foreground">All contacts:</span>
            <span className="text-2xl font-bold">{filtered.length}</span>
          </div>
          <div className="text-xs text-muted-foreground">{inactive} inactive</div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">{selected.length} selected</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              selected.forEach((id) => onStatus(id, "unsubscribed"));
              setSelected([]);
            }}
          >
            Unsubscribe
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              selected.forEach((id) => onDelete(id));
              setSelected([]);
            }}
          >
            Delete
          </Button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3 text-left font-medium">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort("email")}>
                  Email address <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort("name")}>
                  Name <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">Autoresponder day</th>
              <th className="px-4 py-3 text-left font-medium">
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort("created_at")}
                >
                  Subscribed on <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">Updated on</th>
              <th className="px-4 py-3 text-left font-medium">IP address</th>
              <th className="px-4 py-3 text-left font-medium">Origin</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={9}>
                  No contacts found.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t align-top">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={() => toggleOne(c.id)}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="inline-flex items-center gap-2 font-semibold">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.email}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{listName(c.list_id)}</div>
                </td>
                <td className="px-4 py-4">
                  {`${c.first_name} ${c.last_name}`.trim() || (
                    <span className="text-muted-foreground">n/a</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-6 rounded-full ${
                          i < 2 ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 font-medium">{fmt(c.created_at)}</td>
                <td className="px-4 py-4 text-muted-foreground">n/a</td>
                <td className="px-4 py-4 text-muted-foreground">n/a</td>
                <td className="px-4 py-4 font-medium">List import</td>
                <td className="px-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onStatus(c.id, "subscribed")}>
                        Mark subscribed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatus(c.id, "unsubscribed")}>
                        Mark unsubscribed
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(c.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center justify-center gap-2">
          {pages.map((p, i) => (
            <span key={p} className="flex items-center gap-2">
              {i > 0 && p - pages[i - 1]! > 1 && <span className="text-muted-foreground">…</span>}
              <button
                onClick={() => setPage(p)}
                className={`h-8 min-w-8 rounded-full px-2 text-sm ${
                  p === current ? "border font-semibold shadow-sm" : "text-muted-foreground"
                }`}
              >
                {p}
              </button>
            </span>
          ))}
          <button
            onClick={() => setPage(Math.min(current + 1, pageCount))}
            className="h-8 w-8 rounded-full border text-sm"
            aria-label="Next page"
          >
            ›
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Show:
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}


function CreateListDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const m = useMutation({
    mutationFn: () => createContactList({ data: { name, description } }),
    onSuccess: () => {
      toast.success("List created");
      setName("");
      setDescription("");
      onOpenChange(false);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create list</DialogTitle>
          <DialogDescription>Group your contacts into a mailing list.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="list-name">List name</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Newsletter subscribers"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="list-desc">Description</Label>
            <Textarea
              id="list-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || m.isPending} onClick={() => m.mutate()}>
            Create list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type AddMethod = "choose" | "single" | "file" | "integration" | "form";

function AddContactsDialog({
  open,
  onOpenChange,
  lists,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lists: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [step, setStep] = useState<AddMethod>("choose");
  const [listId, setListId] = useState("");
  const [email, setEmail] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [tags, setTags] = useState("");
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState("");

  const activeList = listId || lists[0]?.id || "";

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(() => setStep("choose"), 200);
  };

  const single = useMutation({
    mutationFn: () =>
      addContact({
        data: {
          list_id: activeList,
          email,
          first_name: first,
          last_name: last,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Contact added");
      setEmail("");
      setFirst("");
      setLast("");
      setTags("");
      close(false);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulk = useMutation({
    mutationFn: () => addContactsBulk({ data: { list_id: activeList, raw } }),
    onSuccess: (r) => {
      toast.success(`${r.inserted} contacts imported`);
      setRaw("");
      setFileName("");
      close(false);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    const isSheet = /\.(xlsx|xls|xlsm|ods)$/i.test(file.name);
    try {
      if (isSheet) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const emails = new Set<string>();
        for (const name of wb.SheetNames) {
          const sheet = wb.Sheets[name];
          if (!sheet) continue;
          const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
          for (const row of rows) {
            for (const cell of row ?? []) {
              const v = String(cell ?? "").trim();
              if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) emails.add(v.toLowerCase());
            }
          }
        }
        if (emails.size === 0) {
          toast.error("No email addresses found in that file");
          return;
        }
        setRaw([...emails].join("\n"));
      } else {
        setRaw(await file.text());
      }
    } catch {
      toast.error("Could not read that file");
    }
  };


  const listPicker = (
    <div className="space-y-2">
      <Label>List</Label>
      <Select value={activeList} onValueChange={setListId}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a list" />
        </SelectTrigger>
        <SelectContent>
          {lists.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={step === "choose" ? "max-w-3xl" : "max-w-lg"}>
        {step === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center font-display text-2xl">
                How do you want to add contacts?
              </DialogTitle>
              <DialogDescription className="sr-only">Choose an import method</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { key: "single", label: "One by one", icon: UserPlus },
                  { key: "file", label: "From file", icon: FileText },
                  { key: "integration", label: "Via integration", icon: RefreshCw },
                  { key: "form", label: "Via signup form", icon: ClipboardList },
                ] as const
              ).map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setStep(o.key)}
                  className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                >
                  <o.icon className="h-9 w-9 text-primary" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{o.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : step === "single" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add one contact</DialogTitle>
              <DialogDescription>Enter the contact details manually.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {listPicker}
              <div className="space-y-2">
                <Label htmlFor="c-email">Email</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-first">First name</Label>
                  <Input id="c-first" value={first} onChange={(e) => setFirst(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-last">Last name</Label>
                  <Input id="c-last" value={last} onChange={(e) => setLast(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-tags">Tags (comma separated)</Label>
                <Input
                  id="c-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="lead, webinar"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("choose")}>
                Back
              </Button>
              <Button
                disabled={!activeList || !email.trim() || single.isPending}
                onClick={() => single.mutate()}
              >
                Add contact
              </Button>
            </DialogFooter>
          </>
        ) : step === "file" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add contacts from file</DialogTitle>
              <DialogDescription>
                Upload a CSV, TXT, or Excel (XLSX/XLS) file, or paste addresses below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {listPicker}
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center hover:border-primary">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {fileName || "Click to choose a CSV / TXT / Excel file"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Emails are detected automatically
                </span>
                <input
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls,.xlsm,.ods,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => void readFile(e.target.files?.[0])}
                />
              </label>
              <div className="space-y-2">
                <Label htmlFor="c-bulk">Emails</Label>
                <Textarea
                  id="c-bulk"
                  rows={6}
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={"one@example.com\ntwo@example.com"}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("choose")}>
                Back
              </Button>
              <Button
                disabled={!activeList || !raw.trim() || bulk.isPending}
                onClick={() => bulk.mutate()}
              >
                Import contacts
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {step === "integration" ? "Via integration" : "Via signup form"}
              </DialogTitle>
              <DialogDescription>
                {step === "integration"
                  ? "Sync contacts automatically from an external app."
                  : "Collect contacts with a hosted signup form."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
              {step === "integration" ? (
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              ) : (
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              )}
              <p className="max-w-sm text-sm text-muted-foreground">
                This option is coming soon. For now you can add contacts one by one or import them
                from a file.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("choose")}>
                Back
              </Button>
              <Button onClick={() => setStep("file")}>Import from file</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
