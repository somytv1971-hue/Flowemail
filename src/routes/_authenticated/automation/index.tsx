import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { format } from "date-fns";
import {
  listWorkflows,
  updateWorkflow,
  deleteWorkflow,
} from "@/lib/workflows.functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Plus, Search, MoreVertical, Trash2, Zap, Info } from "lucide-react";
import { toast } from "sonner";
import { AutomationMessagesTab } from "@/components/automation-messages-tab";


export const Route = createFileRoute("/_authenticated/automation/")({
  head: () => ({
    meta: [
      { title: "Automation — Flowmail" },
      { name: "description", content: "Manage your automation workflows, messages and events." },
      { property: "og:title", content: "Automation — Flowmail" },
      { property: "og:description", content: "Manage your automation workflows, messages and events." },
    ],
  }),
  component: AutomationPage,
});

const workflowsQO = queryOptions({
  queryKey: ["workflows"],
  queryFn: () => listWorkflows(),
});

function AutomationPage() {
  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-semibold">Automation</h1>
        <p className="mt-1 text-muted-foreground">
          Design workflows that respond to your contacts in real time.
        </p>
      </div>

      <Tabs defaultValue="workflows" className="mt-6">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="messages">Automation messages</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="mt-6">
          <WorkflowsTab />
        </TabsContent>
        <TabsContent value="messages" className="mt-6">
          <AutomationMessagesTab />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <ComingSoon title="Events" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkflowsTab() {
  const qc = useQueryClient();
  const list = useServerFn(listWorkflows);
  const { data: workflows = [], isLoading } = useQuery({
    ...workflowsQO,
    queryFn: () => list(),
  });
  const [search, setSearch] = useState("");

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show statistics for:</span>
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-32 border-none bg-transparent text-primary font-medium shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Sort by:</span>
          <Select defaultValue="created">
            <SelectTrigger className="h-8 w-40 border-none bg-transparent text-primary font-medium shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Newest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="progress">In progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-52 pl-8"
            />
          </div>
          <CreateButton />
        </div>
      </div>

      <div className="border-b px-4 py-2 text-right text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          Web interactions: {workflows.reduce((s, w) => s + w.in_progress, 0)}
          <Info className="h-3 w-3" />
        </span>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState onCreated={() => qc.invalidateQueries({ queryKey: ["workflows"] })} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created on</th>
                <th className="px-4 py-3">Start on</th>
                <th className="px-4 py-3">End on</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">In progress</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <WorkflowRow key={w.id} w={w} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WorkflowRow({ w }: { w: any }) {
  const qc = useQueryClient();
  const update = useServerFn(updateWorkflow);
  const remove = useServerFn(deleteWorkflow);

  const toggle = useMutation({
    mutationFn: (status: "published" | "paused") => update({ data: { id: w.id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });

  const del = useMutation({
    mutationFn: () => remove({ data: { id: w.id } }),
    onSuccess: () => {
      toast.success("Workflow deleted");
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
  });

  const published = w.status === "published";

  return (
    <tr className="border-b last:border-0 hover:bg-muted/20">
      <td className="px-4 py-4">
        <Checkbox />
      </td>
      <td className="px-4 py-4 font-medium">
        <Link
          to="/automation/workflows/$id"
          params={{ id: w.id }}
          className="text-primary hover:underline"
        >
          {w.name}
        </Link>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={published}
            onCheckedChange={(c) => toggle.mutate(c ? "published" : "paused")}
          />
          <span className={published ? "text-success" : "text-muted-foreground"}>
            {published ? "Published" : "Paused"}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <DateCell iso={w.created_at} />
      </td>
      <td className="px-4 py-4">
        <DateCell iso={w.start_on} />
      </td>
      <td className="px-4 py-4 text-muted-foreground">{w.end_on ? format(new Date(w.end_on), "MMM d, yyyy") : "never"}</td>
      <td className="px-4 py-4">{w.completed}</td>
      <td className="px-4 py-4">{w.in_progress}</td>
      <td className="px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => del.mutate()} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function DateCell({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <div>
      <div>{format(d, "MMM d, yyyy")}</div>
      <div className="text-xs text-muted-foreground">{format(d, "h:mm a")}</div>
    </div>
  );
}

function CreateButton() {
  return (
    <Button size="sm" className="gap-1.5" asChild>
      <Link to="/automation/workflows/new">
        <Plus className="h-4 w-4" /> Create workflow
      </Link>
    </Button>
  );
}

function EmptyState({ onCreated: _onCreated }: { onCreated: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Zap className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold">No workflows yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first automation workflow to start engaging contacts.
        </p>
      </div>
      <CreateButton />
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">Coming in the next release.</p>
    </div>
  );
}
