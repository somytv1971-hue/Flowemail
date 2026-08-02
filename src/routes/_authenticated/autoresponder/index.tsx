import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import {
  listAutoresponders,
  createAutoresponder,
  updateAutoresponder,
  deleteAutoresponder,
} from "@/lib/autoresponders.functions";
import { CreateAutoresponderDialog } from "@/components/create-autoresponder-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  Search,
  MoreVertical,
  Trash2,
  Pencil,
  Send,
  CalendarClock,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/autoresponder/")({
  head: () => ({
    meta: [
      { title: "Manage autoresponders — Flowmail" },
      {
        name: "description",
        content: "Create and manage sequential autoresponder emails for your lists.",
      },
      { property: "og:title", content: "Manage autoresponders — Flowmail" },
      {
        property: "og:description",
        content: "Create and manage sequential autoresponder emails for your lists.",
      },
    ],
  }),
  component: AutoresponderList,
});

function cycleLabel(r: any) {
  if (r.send_mode === "immediately") return "Send immediately, any day of the week.";
  if (r.send_mode === "exact_time")
    return `Send at ${r.send_time}, any day of the week.`;
  return "Send same time signed up, any day of the week.";
}

function AutoresponderList() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const list = useServerFn(listAutoresponders);
  const create = useServerFn(createAutoresponder);
  const update = useServerFn(updateAutoresponder);
  const remove = useServerFn(deleteAutoresponder);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["autoresponders"],
    queryFn: () => list(),
  });

  const createMut = useMutation({
    mutationFn: () => create(),
    onSuccess: (row: any) => {
      qc.invalidateQueries({ queryKey: ["autoresponders"] });
      setDialogOpen(false);
      navigate({ to: "/autoresponder/$id", params: { id: row.id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not create autoresponder"),
  });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; status: "on" | "off" }) => update({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autoresponders"] }),
    onError: (e: any) => toast.error(e.message ?? "Could not update"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Autoresponder deleted");
      qc.invalidateQueries({ queryKey: ["autoresponders"] });
    },
  });

  const filtered = rows.filter((r: any) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="border-b">
        <span className="inline-block border-b-2 border-primary pb-3 font-display text-lg font-semibold">
          Manage autoresponders
        </span>
      </div>

      <div className="mt-6 rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-full pl-8"
            />
          </div>

          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-32 border-none bg-transparent font-medium text-primary shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lists</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-4">
            <button
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => toast.info("Content sharing arrives in a later release.")}
            >
              Manage content sharing
            </button>
            <Button className="rounded-full" onClick={() => setDialogOpen(true)}>
              Create autoresponder
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Send className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">No autoresponders yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up a drip sequence that sends automatically after signup.
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>Create autoresponder</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-10 px-4 py-3">
                    <Checkbox />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Autoresponder name</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Cycle day</th>
                  <th className="px-4 py-3 text-left font-medium">Created on</th>
                  <th className="px-4 py-3 text-right font-medium">Delivered</th>
                  <th className="px-4 py-3 text-right font-medium">Open rate</th>
                  <th className="px-4 py-3 text-right font-medium">Click rate</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Checkbox />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-9 shrink-0 place-items-center rounded border bg-muted text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <button
                            className="font-semibold text-foreground hover:text-primary hover:underline"
                            onClick={() =>
                              navigate({
                                to: "/autoresponder/$id",
                                params: { id: r.id },
                              })
                            }
                          >
                            {r.name}
                          </button>
                          <div className="text-xs text-muted-foreground">{r.list_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={r.status === "on"}
                          onCheckedChange={(v) =>
                            toggleMut.mutate({ id: r.id, status: v ? "on" : "off" })
                          }
                        />
                        <span className="text-xs font-medium">
                          {r.status === "on" ? "On" : "Off"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="grid h-8 w-8 place-items-center rounded border text-xs font-semibold">
                          {r.cycle_day}
                        </span>
                        <span className="text-xs">{cycleLabel(r)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-primary">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                      <div className="text-muted-foreground">
                        {format(new Date(r.created_at), "h:mm a")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{r.delivered}</td>
                    <td className="px-4 py-3 text-right">{Number(r.open_rate)}%</td>
                    <td className="px-4 py-3 text-right">{Number(r.click_rate)}%</td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate({ to: "/autoresponder/$id", params: { id: r.id } })
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info("Scheduling reports arrive in a later release.")
                            }
                          >
                            <CalendarClock className="mr-2 h-4 w-4" /> View schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => delMut.mutate(r.id)}
                          >
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
        )}
      </div>

      <CreateAutoresponderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pending={createMut.isPending}
        onSelfBuild={() => createMut.mutate()}
      />
    </div>
  );
}
