import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { getWorkflow, updateWorkflow } from "@/lib/workflows.functions";
import { ELEMENT_SECTIONS, findStartElement } from "@/lib/workflow-elements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Undo2,
  Redo2,
  Settings2,
  ChevronLeft,
  Save,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import {
  WorkflowSubscribePanel,
  type SubscribeConfig,
} from "@/components/workflow-subscribe-panel";
import {
  WorkflowSendMessagePanel,
  type SendMessageConfig,
} from "@/components/workflow-send-message-panel";
import {
  WorkflowCanvas,
  type WorkflowNode,
  type WorkflowEdge,
} from "@/components/workflow-canvas";
import {
  WorkflowMessageOpenedPanel,
  type MessageOpenedConfig,
} from "@/components/workflow-message-opened-panel";


export const Route = createFileRoute("/_authenticated/automation/workflows/$id")({
  head: () => ({
    meta: [
      { title: "Workflow builder — Flowmail" },
      { name: "description", content: "Design your automation workflow visually." },
    ],
  }),
  component: BuilderPage,
});


function BuilderPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getWorkflow);
  const update = useServerFn(updateWorkflow);

  const qo = useMemo(
    () =>
      queryOptions({
        queryKey: ["workflow", id],
        queryFn: () => get({ data: { id } }),
      }),
    [id, get],
  );
  const { data: workflow, isLoading } = useQuery(qo);

  const [name, setName] = useState("");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tab, setTab] = useState<"add" | "props">("add");

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setNodes((workflow.nodes as WorkflowNode[]) ?? []);
      setEdges(((workflow as any).edges as WorkflowEdge[]) ?? []);
    }
  }, [workflow]);

  const save = useMutation({
    mutationFn: (patch: { name?: string; nodes?: WorkflowNode[]; edges?: WorkflowEdge[] }) =>
      update({ data: { id, ...patch } }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["workflow", id] });
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const publish = useMutation({
    mutationFn: () => update({ data: { id, status: "published", nodes, edges, name } }),
    onSuccess: () => {
      toast.success("Workflow published");
      qc.invalidateQueries({ queryKey: ["workflows"] });
      navigate({ to: "/automation" });
    },
  });

  const placeElement = (elementId: string, label: string, x?: number, y?: number) => {
    const last = nodes[nodes.length - 1];
    const node: WorkflowNode = {
      id: crypto.randomUUID(),
      type: "step",
      element: elementId,
      label,
      x: x ?? last?.x ?? 400,
      y: y ?? (last ? last.y + 160 : 200),
    };
    setNodes([...nodes, node]);
    if (last && x === undefined)
      setEdges([...edges, { id: crypto.randomUUID(), source: last.id, target: node.id }]);
    setSelectedId(node.id);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId || n.type === "start"));
    setEdges(edges.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedId === nodeId) setSelectedId(null);
  };


  if (isLoading || !workflow) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading workflow…</div>;
  }

  const startEl = findStartElement(workflow.start_element);
  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="-mx-6 -my-8 flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/automation">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="h-6 w-px bg-border" />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 w-64 border-transparent bg-transparent font-display text-base font-semibold shadow-none focus-visible:border-input"
        />
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {workflow.channel === "web" ? "Web" : "Email"}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => save.mutate({ name, nodes, edges })}
            disabled={save.isPending}
          >
            <Save className="mr-1.5 h-4 w-4" /> Save
          </Button>
          <Button size="sm" onClick={() => publish.mutate()} disabled={publish.isPending}>
            <Play className="mr-1.5 h-4 w-4" /> Save and publish
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Canvas */}
        <div className="relative flex min-w-0 flex-1">
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            zoom={zoom}
            selectedId={selectedId}
            startLabel={startEl?.label}
            onSelect={(nid) => {
              setSelectedId(nid);
              if (nid) setTab("props");
            }}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onDeleteNode={deleteNode}
            onDropElement={(payload, x, y) => placeElement(payload.id, payload.label, x, y)}
          />

          {/* Zoom controls */}
          <div className="pointer-events-auto absolute bottom-4 left-4 flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(1)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="pointer-events-none absolute bottom-4 right-4 rounded-md border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            Drag elements onto the canvas · drag the bottom dot to connect · click a line to remove it
          </div>
        </div>


        {/* Sidebar */}
        <aside className="flex w-[360px] flex-col border-l bg-card">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="add"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                ADD ELEMENTS
              </TabsTrigger>
              <TabsTrigger
                value="props"
                className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                PROPERTIES
              </TabsTrigger>
            </TabsList>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === "add" ? (
                <AddElementsPanel onAdd={(eid, label) => placeElement(eid, label)} />
              ) : (
                <PropertiesPanel
                  node={selected}
                  workflowName={name}
                  onConfigChange={(patch) =>
                    setNodes((ns) =>
                      ns.map((n) =>
                        n.id === selectedId ? { ...n, config: { ...(n.config ?? {}), ...patch } } : n,
                      ),
                    )
                  }
                />
              )}
            </div>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}


function AddElementsPanel({ onAdd }: { onAdd: (id: string, label: string) => void }) {
  const [channelTab, setChannelTab] = useState<"email" | "web">("email");
  return (
    <div className="p-4">
      <p className="mb-3 text-xs text-muted-foreground">
        Use the <b>email</b> channel for email subscribers and the <b>web</b> channel for visitors.
      </p>
      <Tabs value={channelTab} onValueChange={(v) => setChannelTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">EMAIL</TabsTrigger>
          <TabsTrigger value="web">
            WEB <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">New</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Accordion type="multiple" defaultValue={["conditions", "actions"]} className="mt-4">
        {ELEMENT_SECTIONS.map((section) => (
          <AccordionItem key={section.key} value={section.key}>
            <AccordionTrigger className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.label}
            </AccordionTrigger>
            <AccordionContent>
              {section.groups.map((group) => (
                <div key={group.label} className="mb-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "copy";
                            e.dataTransfer.setData(
                              "application/x-workflow-element",
                              JSON.stringify({ id: item.id, label: item.label }),
                            );
                          }}
                          onClick={() => onAdd(item.id, item.label)}
                          className="flex cursor-grab items-center gap-2 rounded-lg border bg-background p-2 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5 active:cursor-grabbing"
                        >
                          <div className="grid h-8 w-8 shrink-0 rotate-45 place-items-center rounded bg-primary/10 text-primary">
                            <Icon className="h-3.5 w-3.5 -rotate-45" />
                          </div>
                          <span className="line-clamp-2 font-medium leading-tight">{item.label}</span>
                        </button>

                      );
                    })}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function PropertiesPanel({
  node,
  workflowName,
  onConfigChange,
}: {
  node: WorkflowNode | null;
  workflowName: string;
  onConfigChange: (patch: SubscribeConfig & SendMessageConfig & MessageOpenedConfig) => void;
}) {
  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
        <Settings2 className="mb-3 h-8 w-8" />
        <p>Select an element on the canvas to edit its properties.</p>
      </div>
    );
  }

  if (node.element === "a_send_message") {
    return <WorkflowSendMessagePanel config={node.config ?? {}} onChange={onConfigChange} />;
  }

  if (node.element === "opens_message" || node.element === "c_message_opened") {
    return <WorkflowMessageOpenedPanel config={node.config ?? {}} onChange={onConfigChange} />;
  }

  const isSubscribe =
    node.type === "start" ||
    node.element === "subscribes" ||
    node.element === "c_subscribed_via";

  if (isSubscribe) {
    return (
      <WorkflowSubscribePanel config={node.config ?? {}} onChange={onConfigChange} />
    );
  }


  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Workflow</div>
        <div className="mt-1 font-medium">{workflowName}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Element</div>
        <div className="mt-1 font-medium">{node.label ?? node.element}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Type</div>
        <div className="mt-1 capitalize">{node.type}</div>
      </div>
      <p className="text-xs text-muted-foreground">
        Detailed configuration (delay, conditions, targeting) is coming soon.
      </p>
    </div>
  );
}

