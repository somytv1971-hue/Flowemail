import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import {
  listAutomationMessages,
  createAutomationMessage,
  deleteAutomationMessage,
} from "@/lib/automation-messages.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Search, MoreVertical, Trash2, Mail, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export function AutomationMessagesTab() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const list = useServerFn(listAutomationMessages);
  const create = useServerFn(createAutomationMessage);
  const remove = useServerFn(deleteAutomationMessage);
  const [search, setSearch] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["automation-messages"],
    queryFn: () => list(),
  });

  const createMut = useMutation({
    mutationFn: () => create(),
    onSuccess: (row: any) => {
      qc.invalidateQueries({ queryKey: ["automation-messages"] });
      navigate({ to: "/automation/messages/$id", params: { id: row.id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not create message"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Message deleted");
      qc.invalidateQueries({ queryKey: ["automation-messages"] });
    },
  });

  const filtered = messages.filter((m: any) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
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
          <SelectTrigger className="h-8 w-36 border-none bg-transparent font-medium text-primary shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All messages</SelectItem>
            <SelectItem value="in_use">In use</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="h-8 w-32 border-none bg-transparent font-medium text-primary shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All lists</SelectItem>
          </SelectContent>
        </Select>

        <Button
          className="ml-auto rounded-full"
          onClick={() => createMut.mutate()}
          disabled={createMut.isPending}
        >
          Create automation message
        </Button>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">No automation messages yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a message your workflows can send.
            </p>
          </div>
          <Button onClick={() => createMut.mutate()}>Create automation message</Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 px-4 py-3">
                  <Checkbox />
                </th>
                <th className="px-4 py-3">Message name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created on</th>
                <th className="px-4 py-3">Delivered</th>
                <th className="px-4 py-3">Open rate</th>
                <th className="px-4 py-3">Click rate</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m: any) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-4">
                    <Checkbox />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-14 w-11 shrink-0 place-items-center rounded border bg-muted/40 text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          to="/automation/messages/$id"
                          params={{ id: m.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {m.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{m.list_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {m.status === "in_use" ? "In use" : "Incomplete"}
                  </td>
                  <td className="px-4 py-4">
                    <div>{format(new Date(m.created_at), "MMM d, yyyy")}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(m.created_at), "h:mm a")}
                    </div>
                  </td>
                  <td className="px-4 py-4">{m.status === "in_use" ? m.delivered : "n/a"}</td>
                  <td className="px-4 py-4">
                    {m.open_rate != null ? `${m.open_rate}%` : "n/a"}
                  </td>
                  <td className="px-4 py-4">
                    {m.click_rate != null ? `${m.click_rate}%` : "n/a"}
                  </td>
                  <td className="px-4 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => delMut.mutate(m.id)}
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
  );
}
