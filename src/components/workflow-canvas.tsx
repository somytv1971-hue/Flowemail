import { useCallback, useRef, useState } from "react";
import { Trash2, CheckCircle2, Check, X } from "lucide-react";
import { subscribeSummary, type SubscribeConfig } from "@/components/workflow-subscribe-panel";
import { sendMessageSummary, type SendMessageConfig } from "@/components/workflow-send-message-panel";
import {
  messageOpenedSummary,
  type MessageOpenedConfig,
} from "@/components/workflow-message-opened-panel";
import {
  moveToListSummary,
  type MoveToListConfig,
} from "@/components/workflow-move-to-list-panel";
import {
  removeContactSummary,
  type RemoveContactConfig,
} from "@/components/workflow-remove-contact-panel";
import { waitSummary, type WaitConfig } from "@/components/workflow-wait-panel";
import { ELEMENT_SECTIONS } from "@/lib/workflow-elements";

export type WorkflowNode = {
  id: string;
  type: string;
  element: string;
  channel?: string;
  label?: string;
  x: number;
  y: number;
  config?: SubscribeConfig & SendMessageConfig & MessageOpenedConfig & MoveToListConfig & RemoveContactConfig & WaitConfig;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  branch?: "yes" | "no";
};

export const NODE_W = 300;
export const NODE_H = 76;
export const CANVAS_W = 2600;
export const CANVAS_H = 1800;

const CONDITION_ELEMENTS = ["opens_message", "c_message_opened"];

const ALL_ITEMS = ELEMENT_SECTIONS.flatMap((s) => s.groups.flatMap((g) => g.items));

function iconFor(element: string) {
  return ALL_ITEMS.find((i) => i.id === element)?.icon;
}

function isConditionNode(node: WorkflowNode) {
  return CONDITION_ELEMENTS.includes(node.element);
}

function nodeLabel(node: WorkflowNode, startLabel?: string) {
  if (node.type === "start")
    return subscribeSummary(node.config ?? {}) || `Subscribed via ${startLabel ?? "any list"}`;
  if (node.element === "a_send_message") return sendMessageSummary(node.config ?? {});
  if (isConditionNode(node)) return messageOpenedSummary(node.config ?? {});
  if (node.element === "a_move_list") return moveToListSummary(node.config ?? {});
  if (node.element === "a_remove_contact" || node.element === "a_remove_list")
    return removeContactSummary(node.config ?? {});
  return node.label ?? node.element;
}

function outAnchor(node: WorkflowNode, branch?: "yes" | "no") {
  if (isConditionNode(node) && branch)
    return { x: node.x + NODE_W * (branch === "yes" ? 0.32 : 0.68), y: node.y + NODE_H };
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H };
}

function path(x1: number, y1: number, x2: number, y2: number) {
  const dy = Math.max(40, Math.abs(y2 - y1) / 2);
  return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
}


export function WorkflowCanvas({
  nodes,
  edges,
  zoom,
  selectedId,
  startLabel,
  onSelect,
  onNodesChange,
  onEdgesChange,
  onDeleteNode,
  onDropElement,
}: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  zoom: number;
  selectedId: string | null;
  startLabel?: string;
  onSelect: (id: string | null) => void;
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onEdgesChange: (edges: WorkflowEdge[]) => void;
  onDeleteNode: (id: string) => void;
  onDropElement: (payload: { id: string; label: string }, x: number, y: number) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [link, setLink] = useState<{
    source: string;
    branch?: "yes" | "no";
    x: number;
    y: number;
  } | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);

  const toCanvas = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const rect = areaRef.current!.getBoundingClientRect();
      return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
    },
    [zoom],
  );

  const onMouseMove = (e: React.MouseEvent) => {
    if (drag) {
      const p = toCanvas(e);
      onNodesChange(
        nodes.map((n) =>
          n.id === drag.id
            ? { ...n, x: Math.max(0, p.x - drag.dx), y: Math.max(0, p.y - drag.dy) }
            : n,
        ),
      );
    } else if (link) {
      const p = toCanvas(e);
      setLink({ ...link, x: p.x, y: p.y });
    }
  };

  const finishLink = (targetId?: string) => {
    if (link && targetId && targetId !== link.source) {
      const exists = edges.some(
        (e) => e.source === link.source && e.target === targetId && e.branch === link.branch,
      );
      if (!exists)
        onEdgesChange([
          ...edges,
          { id: crypto.randomUUID(), source: link.source, target: targetId, branch: link.branch },
        ]);
    }
    setLink(null);
  };

  return (
    <div
      className="relative flex-1 overflow-auto bg-[radial-gradient(circle,hsl(var(--border))_1px,transparent_1px)] [background-size:24px_24px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("application/x-workflow-element");
        if (!raw) return;
        const p = toCanvas(e);
        onDropElement(JSON.parse(raw), p.x - NODE_W / 2, p.y - NODE_H / 2);
      }}
    >
      <div
        ref={areaRef}
        className="relative"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
        }}
        onMouseMove={onMouseMove}
        onMouseUp={() => {
          setDrag(null);
          finishLink();
        }}
        onMouseLeave={() => {
          setDrag(null);
          setLink(null);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onSelect(null);
        }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {edges.map((edge) => {
            const s = nodes.find((n) => n.id === edge.source);
            const t = nodes.find((n) => n.id === edge.target);
            if (!s || !t) return null;
            const a = outAnchor(s, edge.branch);
            const d = path(a.x, a.y, t.x + NODE_W / 2, t.y);
            const stroke =
              edge.branch === "yes"
                ? "stroke-success"
                : edge.branch === "no"
                  ? "stroke-destructive"
                  : "stroke-primary/60";
            const marker =
              edge.branch === "yes"
                ? "url(#wf-arrow-yes)"
                : edge.branch === "no"
                  ? "url(#wf-arrow-no)"
                  : "url(#wf-arrow)";
            return (
              <g key={edge.id} className="pointer-events-auto">
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  onMouseEnter={() => setHoverEdge(edge.id)}
                  onMouseLeave={() => setHoverEdge(null)}
                  onClick={() => onEdgesChange(edges.filter((x) => x.id !== edge.id))}
                  style={{ cursor: "pointer" }}
                />
                <path
                  d={d}
                  fill="none"
                  strokeWidth={2}
                  className={hoverEdge === edge.id ? "stroke-destructive" : stroke}
                  markerEnd={marker}
                />
              </g>
            );
          })}
          {link &&
            (() => {
              const s = nodes.find((n) => n.id === link.source);
              if (!s) return null;
              const a = outAnchor(s, link.branch);
              return (
                <path
                  d={path(a.x, a.y, link.x, link.y)}
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  className={
                    link.branch === "yes"
                      ? "stroke-success"
                      : link.branch === "no"
                        ? "stroke-destructive"
                        : "stroke-primary"
                  }
                />
              );
            })()}
          <defs>
            <marker
              id="wf-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary/60" />
            </marker>
            <marker
              id="wf-arrow-yes"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-success" />
            </marker>
            <marker
              id="wf-arrow-no"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-destructive" />
            </marker>
          </defs>
        </svg>

        {nodes.map((node) => {
          const Icon = iconFor(node.element);
          const isStart = node.type === "start";
          const isCondition = isConditionNode(node);
          const showNo = isCondition && (node.config?.wait_mode ?? "after_time") !== "never";
          return (
            <div
              key={node.id}
              className={`group absolute select-none rounded-xl border-2 bg-card shadow-sm transition-colors ${
                selectedId === node.id ? "border-primary shadow-md" : "border-border hover:border-primary/40"
              }`}
              style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).closest("[data-handle]")) return;
                const p = toCanvas(e);
                setDrag({ id: node.id, dx: p.x - node.x, dy: p.y - node.y });
                onSelect(node.id);
              }}
              onMouseUp={() => finishLink(node.id)}
            >
              {/* input handle */}
              {!isStart && (
                <div
                  data-handle="in"
                  className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background"
                  onMouseUp={() => finishLink(node.id)}
                />
              )}
              <div className="flex h-full cursor-grab items-center gap-3 p-3 active:cursor-grabbing">
                <div
                  className={`grid h-10 w-10 shrink-0 rotate-45 place-items-center rounded-md ${
                    isStart ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                  }`}
                >
                  {Icon ? (
                    <Icon className="h-4 w-4 -rotate-45" />
                  ) : (
                    <div className="-rotate-45 text-sm font-bold">{isStart ? "S" : "•"}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{nodeLabel(node, startLabel)}</div>
                  {isStart && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="h-3 w-3" /> Start element
                    </div>
                  )}
                </div>
                {!isStart && (
                  <button
                    data-handle="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNode(node.id);
                    }}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Delete element"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
              {/* output handles */}
              {isCondition ? (
                <>
                  <button
                    data-handle="out-yes"
                    title="If yes"
                    aria-label="If yes connector"
                    className="absolute bottom-0 grid h-6 w-6 translate-y-1/2 place-items-center rounded-full border-2 border-background bg-success text-success-foreground shadow-sm transition-transform hover:scale-110"
                    style={{ left: `${32}%`, marginLeft: -12 }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const p = toCanvas(e);
                      setLink({ source: node.id, branch: "yes", x: p.x, y: p.y });
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  {showNo && (
                    <button
                      data-handle="out-no"
                      title="If no"
                      aria-label="If no connector"
                      className="absolute bottom-0 grid h-6 w-6 translate-y-1/2 place-items-center rounded-full border-2 border-background bg-destructive text-destructive-foreground shadow-sm transition-transform hover:scale-110"
                      style={{ left: `${68}%`, marginLeft: -12 }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const p = toCanvas(e);
                        setLink({ source: node.id, branch: "no", x: p.x, y: p.y });
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <div
                  data-handle="out"
                  title="Drag to connect"
                  className="absolute left-1/2 bottom-0 h-4 w-4 -translate-x-1/2 translate-y-1/2 cursor-crosshair rounded-full border-2 border-primary bg-background transition-transform hover:scale-125"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const p = toCanvas(e);
                    setLink({ source: node.id, x: p.x, y: p.y });
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
