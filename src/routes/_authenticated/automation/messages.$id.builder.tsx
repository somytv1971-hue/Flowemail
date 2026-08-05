import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAutomationMessage, updateAutomationMessage } from "@/lib/automation-messages.functions";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  ChevronLeft,
  Undo2,
  Redo2,
  Save,
  Image as ImageIcon,
  Type,
  MousePointerClick,
  PlayCircle,
  MoveVertical,
  Minus,
  Presentation,
  Timer,
  Share2,
  Code2,
  Lightbulb,
  Trash2,
  GripVertical,
  Monitor,
  Smartphone,
  Mail,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/automation/messages/$id/builder")({
  head: () => ({
    meta: [
      { title: "Email builder — Flowmail" },
      {
        name: "description",
        content: "Drag and drop blocks to compose your automation email message.",
      },
      { property: "og:title", content: "Email builder — Flowmail" },
      {
        property: "og:description",
        content: "Drag and drop blocks to compose your automation email message.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BuilderPage,
});

type BlockType =
  | "image"
  | "text"
  | "button"
  | "video"
  | "spacer"
  | "divider"
  | "webinar"
  | "countdown"
  | "social"
  | "html";

const BASIC_BLOCKS: Array<{ type: BlockType; label: string; icon: typeof Type; badge?: string }> = [
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "text", label: "Text", icon: Type },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "video", label: "Video", icon: PlayCircle },
  { type: "spacer", label: "Spacer", icon: MoveVertical },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "webinar", label: "Webinar", icon: Presentation },
  { type: "countdown", label: "Countdown timer", icon: Timer, badge: "NEW" },
  { type: "social", label: "Social", icon: Share2 },
  { type: "html", label: "Custom HTML", icon: Code2 },
];

const SECTION_LAYOUTS = ["1 column", "2 columns", "3 columns", "Left sidebar", "Right sidebar"];

type SectionLayout = (typeof SECTION_LAYOUTS)[number];
type Block = {
  key: string;
  type: BlockType;
  content?: string;
  url?: string;
  layout?: SectionLayout;
  align?: "left" | "center" | "right";
  color?: string;
  bgColor?: string;
  fontSize?: number;
  height?: number;
  date?: string;
  socials?: Record<string, string>;
};

const SOCIAL_NETWORKS = ["facebook", "twitter", "instagram", "linkedin", "youtube"] as const;

const EDITABLE_TEXT: BlockType[] = ["text", "button", "webinar", "html"];

function defaultContent(type: BlockType) {
  switch (type) {
    case "text":
      return "Write your message here. Click to edit this text block.";
    case "button":
      return "Click here";
    case "webinar":
      return "Join our live webinar — Thursday, 6:00 PM";
    case "html":
      return "<div>Custom HTML</div>";
    default:
      return "";
  }
}

function useCountdown(target?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const end = target ? new Date(target).getTime() : NaN;
  const diff = Number.isNaN(end) ? 0 : Math.max(0, end - now);
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  return [
    pad(diff / 86400000),
    pad((diff % 86400000) / 3600000),
    pad((diff % 3600000) / 60000),
    pad((diff % 60000) / 1000),
  ];
}


type BuilderDocument = {
  version: 1;
  blocks: Block[];
  style: MessageStyle;
  header?: HeaderSettings;
  footer?: FooterSettings;
};

const DEFAULT_STYLE: MessageStyle = {
  width: 600,
  backgroundColor: "#FFFFFF",
  backgroundImageOn: false,
  imageUrl: "",
  customCss: "",
};

function parseDocument(value: string | null | undefined): BuilderDocument | null {
  if (!value?.startsWith("FLOWMAIL_BUILDER:")) return null;
  try {
    const parsed = JSON.parse(value.slice("FLOWMAIL_BUILDER:".length)) as BuilderDocument;
    return parsed.version === 1 && Array.isArray(parsed.blocks) ? parsed : null;
  } catch {
    return null;
  }
}

function BlockPreview({
  block,
  editable,
  onStartEdit,
  onCommit,
}: {
  block: Block;
  editable?: boolean;
  onStartEdit?: () => void;
  onCommit?: (content: string) => void;
}) {
  const { type } = block;
  switch (type) {
    case "image":
      return (
        <div className="flex h-32 items-center justify-center rounded bg-muted text-muted-foreground">
          {block.url ? (
            <img
              src={block.url}
              alt={block.content || "Email content"}
              className="h-full w-full rounded object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6" />
          )}
        </div>
      );
    case "text":
      if (editable) {
        return (
          <div
            role="textbox"
            tabIndex={0}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[24px] whitespace-pre-wrap rounded text-sm leading-relaxed text-foreground outline-none"
            onBlur={(event) => onCommit?.(event.currentTarget.innerText)}
            onKeyDown={(event) => {
              if (event.key === "Escape") event.currentTarget.blur();
              event.stopPropagation();
            }}
            ref={(node) => {
              if (node && node.innerText !== (block.content ?? "")) {
                node.innerText = block.content ?? "";
              }
              if (node && document.activeElement !== node) node.focus();
            }}

          />
        );
      }
      return (
        <p
          className="cursor-text text-sm leading-relaxed text-foreground"
          onClick={() => onStartEdit?.()}
        >
          {block.content || "Write your message here. Click to edit this text block."}
        </p>
      );

    case "button":
      return (
        <div className="flex justify-center">
          <a
            href={block.url || "#preview"}
            className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
            onClick={(event) => event.preventDefault()}
          >
            {block.content || "Click here"}
          </a>
        </div>
      );
    case "video":
      return (
        <div className="flex h-32 items-center justify-center rounded bg-muted text-muted-foreground">
          <PlayCircle className="h-7 w-7" />
        </div>
      );
    case "spacer":
      return <div className="h-8" />;
    case "divider":
      return <div className="h-px w-full bg-border" />;
    case "webinar":
      return (
        <div className="rounded border border-dashed p-4 text-center text-sm text-muted-foreground">
          Webinar details block
        </div>
      );
    case "countdown":
      return (
        <div className="flex justify-center gap-2">
          {["02", "14", "37", "09"].map((n) => (
            <span key={n} className="rounded bg-muted px-3 py-2 font-mono text-sm">
              {n}
            </span>
          ))}
        </div>
      );
    case "social":
      return (
        <div className="flex justify-center gap-3 text-muted-foreground">
          <Share2 className="h-5 w-5" />
          <Share2 className="h-5 w-5" />
          <Share2 className="h-5 w-5" />
        </div>
      );
    case "html":
      return (
        <pre className="overflow-x-auto rounded bg-muted p-3 font-mono text-xs text-muted-foreground">
          {block.content || "<div>Custom HTML</div>"}
        </pre>
      );
  }
}

function BuilderPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const get = useServerFn(getAutomationMessage);
  const update = useServerFn(updateAutomationMessage);

  const { data: msg } = useQuery({
    queryKey: ["automation-message", id],
    queryFn: () => get({ data: { id } }),
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const [tab, setTab] = useState<"layout" | "style">("layout");
  const [dragOver, setDragOver] = useState(false);
  const [style, setStyle] = useState<MessageStyle>(DEFAULT_STYLE);
  const [header, setHeader] = useState<HeaderSettings>({
    showViewOnline: false,
    mode: "logo",
    imageUrl: "",
    altText: "Logo",
    alignment: "center",
    width: 120,
    height: 40,
    padChangeIndividually: false,
    padAll: 5,
    backgroundColor: "#FFFFFF",
    transparent: true,
    visibility: "all",
  });
  const [footer, setFooter] = useState<FooterSettings>({
    fontFamily: "Arial",
    fontSize: "12",
    textColor: "#000000",
    bold: false,
    italic: false,
    underline: false,
    alignment: "center",
    linksColor: "#00BAFF",
    backgroundColor: "#FFFFFF",
    transparent: true,
    padChangeIndividually: false,
    padAll: 10,
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [history, setHistory] = useState<Block[][]>([]);
  const [future, setFuture] = useState<Block[][]>([]);
  const [ready, setReady] = useState(false);
  const draggedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!msg || ready) return;
    const document = parseDocument(msg.content_html);
    if (document) {
      setBlocks(document.blocks);
      setStyle({ ...DEFAULT_STYLE, ...document.style });
      if (document.header) setHeader(document.header);
      if (document.footer) setFooter(document.footer);
    }
    setReady(true);
  }, [msg, ready]);

  const commitBlocks = (updater: (current: Block[]) => Block[]) => {
    setBlocks((current) => {
      const next = updater(current);
      if (next === current) return current;
      setHistory((items) => [...items.slice(-29), current]);
      setFuture([]);
      return next;
    });
  };

  const addBlock = (type: BlockType, index?: number) => {
    const block = { key: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type };
    commitBlocks((b) => {
      const next = [...b];
      next.splice(index ?? next.length, 0, block);
      return next;
    });
    setSelected(block.key);
  };

  const addSection = (layout: SectionLayout) => {
    const columns = layout === "3 columns" ? 3 : layout === "1 column" ? 1 : 2;
    const additions: Block[] = Array.from({ length: columns }, (_, index) => ({
      key: `text-${Date.now()}-${index}`,
      type: "text",
      content: `${layout} — column ${index + 1}`,
      layout,
    }));
    commitBlocks((current) => [...current, ...additions]);
    setSelected(additions[0]?.key ?? null);
  };

  const updateSelected = (patch: Partial<Block>) => {
    if (!selected) return;
    commitBlocks((current) =>
      current.map((block) => (block.key === selected ? { ...block, ...patch } : block)),
    );
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [blocks, ...items].slice(0, 30));
    setHistory((items) => items.slice(0, -1));
    setBlocks(previous);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((items) => [...items, blocks].slice(-30));
    setFuture((items) => items.slice(1));
    setBlocks(next);
  };

  const documentValue = () =>
    `FLOWMAIL_BUILDER:${JSON.stringify({ version: 1, blocks, style, header, footer } satisfies BuilderDocument)}`;

  const save = useMutation({
    mutationFn: () =>
      update({
        data: {
          id,
          content_html: documentValue(),
        },
      }),
    onSuccess: () => toast.success("Saved"),
    onError: (error: Error) => toast.error(error.message || "Could not save"),
  });

  return (
    <div className="-mx-4 -mt-6 flex h-[calc(100vh-4rem)] flex-col md:-mx-8">
      {/* Top bar */}
      <header className="flex items-center gap-4 border-b bg-card px-4 py-2.5">
        <button
          type="button"
          onClick={() => navigate({ to: "/automation/messages/$id/design", params: { id } })}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> Back to design and content
        </button>
        <div className="ml-2 flex items-center gap-2 text-muted-foreground">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!history.length}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!future.length} title="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
          <span className="ml-2 inline-flex items-center gap-1 text-xs">
            <Save className="h-3.5 w-3.5" /> {save.isPending ? "Saving…" : "Saved"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Test and preview
          </button>
          <button
            type="button"
            onClick={() =>
              save.mutate(undefined, {
                onSuccess: () => navigate({ to: "/automation/messages/$id", params: { id } }),
              })
            }
            className="text-sm font-medium text-primary hover:underline"
          >
            Save and exit
          </button>
          <Button
            className="rounded-full px-6"
            onClick={() =>
              save.mutate(undefined, {
                onSuccess: () => navigate({ to: "/automation/messages/$id", params: { id } }),
              })
            }
          >
            Next
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Canvas */}
        <div
          className="min-w-0 flex-1 overflow-y-auto bg-muted/40 p-8"
          style={{
            backgroundColor: style.backgroundColor,
            backgroundImage:
              style.backgroundImageOn && style.imageUrl ? `url(${style.imageUrl})` : undefined,
          }}
        >
          <div className="mx-auto" style={{ maxWidth: `${style.width}px` }}>
            {style.customCss && <style>{style.customCss}</style>}
            <div
              className="mb-6 rounded border border-dashed py-2 text-xs tracking-widest text-muted-foreground"
              style={{
                padding: `${header.padAll}px`,
                backgroundColor: header.transparent ? "transparent" : header.backgroundColor,
                textAlign: header.alignment,
              }}
            >
              {header.mode === "online" ? (
                <a href="#preview" className="text-primary underline">
                  View this message online
                </a>
              ) : header.imageUrl ? (
                <img
                  src={header.imageUrl}
                  alt={header.altText}
                  className="inline-block object-contain"
                  style={{ width: `${header.width}px`, height: `${header.height}px` }}
                />
              ) : (
                "LOGO"
              )}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const type = e.dataTransfer.getData("text/block") as BlockType;
                const layout = e.dataTransfer.getData("text/section") as SectionLayout;
                if (type) addBlock(type);
                if (layout) addSection(layout);
              }}
              className={`email-content rounded-lg border-2 border-dashed bg-card p-4 transition ${
                dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              {blocks.length === 0 ? (
                <div className="flex h-56 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                  <p className="text-sm">Start with layout. Drag and drop blocks.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blocks.map((b, index) => (
                    <div
                      key={b.key}
                      draggable={editingKey !== b.key}
                      onDragStart={(event) => {
                        draggedKey.current = b.key;
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const fromKey = draggedKey.current;
                        if (!fromKey || fromKey === b.key) return;
                        commitBlocks((current) => {
                          const from = current.findIndex((item) => item.key === fromKey);
                          if (from < 0) return current;
                          const next = [...current];
                          const [moved] = next.splice(from, 1);
                          if (!moved) return current;
                          next.splice(index, 0, moved);
                          return next;
                        });
                        draggedKey.current = null;
                      }}
                      onClick={() => setSelected(b.key)}
                      onDoubleClick={() => {
                        if (b.type === "text") setEditingKey(b.key);
                      }}
                      className={`group relative rounded border p-4 transition ${
                        selected === b.key
                          ? "border-primary ring-1 ring-primary"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      <BlockPreview
                        block={b}
                        editable={editingKey === b.key}
                        onStartEdit={() => {
                          setSelected(b.key);
                          setEditingKey(b.key);
                        }}
                        onCommit={(content) => {
                          setEditingKey(null);
                          commitBlocks((current) =>
                            current.map((item) =>
                              item.key === b.key ? { ...item, content } : item,
                            ),
                          );
                        }}
                      />

                      <div className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            commitBlocks((s) => s.filter((x) => x.key !== b.key));
                            if (selected === b.key) setSelected(null);
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <footer
              className="mt-6 space-y-1 text-muted-foreground"
              style={{
                fontFamily: footer.fontFamily,
                fontSize: `${footer.fontSize}px`,
                color: footer.textColor,
                fontWeight: footer.bold ? 700 : 400,
                fontStyle: footer.italic ? "italic" : "normal",
                textDecoration: footer.underline ? "underline" : "none",
                textAlign: footer.alignment,
                backgroundColor: footer.transparent ? "transparent" : footer.backgroundColor,
                padding: `${footer.padAll}px`,
              }}
            >
              <p>{msg?.list_name || "Your company"}, 1700, Business street, City, Country</p>
              <p>
                You can{" "}
                <span className="underline" style={{ color: footer.linksColor }}>
                  unsubscribe
                </span>{" "}
                or{" "}
                <span className="underline" style={{ color: footer.linksColor }}>
                  change your details
                </span>{" "}
                at any time.
              </p>
            </footer>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l bg-card lg:block">
          <div className="flex gap-6 border-b px-5 pt-4">
            {(["layout", "style"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`pb-3 text-sm transition ${
                  tab === t
                    ? "border-b-2 border-primary font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "layout" ? "Layout" : "Message style"}
              </button>
            ))}
          </div>

          {tab === "layout" ? (
            <Accordion type="multiple" defaultValue={["basic"]} className="px-2">
              <AccordionItem value="sections">
                <AccordionTrigger className="px-3 text-sm">Sections</AccordionTrigger>
                <AccordionContent className="px-3">
                  <div className="grid grid-cols-2 gap-2">
                    {SECTION_LAYOUTS.map((s) => (
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/section", s)}
                        onClick={() => addSection(s)}
                        key={s}
                        className="rounded-lg border p-3 text-center text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {selected && (
                <AccordionItem value="selected">
                  <AccordionTrigger className="px-3 text-sm">Selected block</AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3">
                    <Label htmlFor="block-content">Content</Label>
                    <Textarea
                      id="block-content"
                      value={blocks.find((block) => block.key === selected)?.content ?? ""}
                      onChange={(event) => updateSelected({ content: event.target.value })}
                      placeholder="Edit block content"
                    />
                    {(["image", "video", "button"] as BlockType[]).includes(
                      blocks.find((block) => block.key === selected)?.type ?? "text",
                    ) && (
                      <Input
                        value={blocks.find((block) => block.key === selected)?.url ?? ""}
                        onChange={(event) => updateSelected({ url: event.target.value })}
                        placeholder="Destination or media URL"
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="basic">
                <AccordionTrigger className="px-3 text-sm">
                  Basic <span className="ml-1 text-primary">blocks</span>
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <div className="grid grid-cols-3 gap-2">
                    {BASIC_BLOCKS.map((b) => (
                      <button
                        key={b.type}
                        type="button"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/block", b.type)}
                        onClick={() => addBlock(b.type)}
                        className="relative flex h-[68px] cursor-grab flex-col items-center justify-center gap-1.5 rounded-lg border bg-background text-[10px] text-muted-foreground transition hover:border-primary hover:text-foreground active:cursor-grabbing"
                      >
                        {b.badge && (
                          <span className="absolute -top-2 right-1 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-semibold text-primary-foreground">
                            {b.badge}
                          </span>
                        )}
                        <b.icon className="h-4 w-4" />
                        {b.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2 rounded-lg bg-muted/60 p-3">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      Drag and drop the blocks anywhere you want to use them.
                      <br />
                      <span className="text-primary underline">How to use blocks in messages</span>
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {["Ecommerce", "Courses", "My blocks"].map((g) => (
                <AccordionItem key={g} value={g}>
                  <AccordionTrigger className="px-3 text-sm">{g}</AccordionTrigger>
                  <AccordionContent className="px-3 pb-4 text-xs text-muted-foreground">
                    Coming in the next release.
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <MessageStylePanel
              style={style}
              setStyle={setStyle}
              header={header}
              setHeader={setHeader}
              footer={footer}
              setFooter={setFooter}
            />
          )}
        </aside>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Message preview</DialogTitle>
            <DialogDescription>Desktop preview of the saved email content.</DialogDescription>
          </DialogHeader>
          <div
            className="mx-auto w-full rounded border bg-card p-6"
            style={{ maxWidth: `${style.width}px` }}
          >
            <div className="space-y-3">
              {blocks.length ? (
                blocks.map((block) => <BlockPreview key={block.key} block={block} />)
              ) : (
                <p className="text-center text-sm text-muted-foreground">Your message is empty.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type MessageStyle = {
  width: number;
  backgroundColor: string;
  backgroundImageOn: boolean;
  imageUrl: string;
  customCss: string;
};

function MessageStylePanel({
  style,
  setStyle,
  header,
  setHeader,
  footer,
  setFooter,
}: {
  style: MessageStyle;
  setStyle: React.Dispatch<React.SetStateAction<MessageStyle>>;
  header: HeaderSettings;
  setHeader: React.Dispatch<React.SetStateAction<HeaderSettings>>;
  footer: FooterSettings;
  setFooter: React.Dispatch<React.SetStateAction<FooterSettings>>;
}) {
  const set = <K extends keyof MessageStyle>(k: K, v: MessageStyle[K]) =>
    setStyle((s) => ({ ...s, [k]: v }));

  return (
    <Accordion type="multiple" defaultValue={["general"]} className="px-2 pb-10">
      <AccordionItem value="general">
        <AccordionTrigger className="px-3 text-sm">General</AccordionTrigger>
        <AccordionContent className="space-y-6 px-3 pb-5">
          {/* Width */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm">Width</Label>
              <div className="flex items-center overflow-hidden rounded-md border">
                <button
                  type="button"
                  onClick={() => set("width", Math.max(320, style.width - 10))}
                  className="px-2 py-1 text-muted-foreground hover:bg-muted"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  value={style.width}
                  onChange={(e) => set("width", Number(e.target.value) || 0)}
                  className="w-14 border-x bg-transparent py-1 text-center text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => set("width", Math.min(900, style.width + 10))}
                  className="px-2 py-1 text-muted-foreground hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-[11px] leading-snug text-muted-foreground">
                We recommend you set the maximum message width as 600 pixels.
                <br />
                <span className="text-primary underline">
                  Learn more about setting the right message width
                </span>
              </p>
            </div>
          </div>

          <Separator />

          {/* Background color */}
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm">Background color</Label>
            <div className="flex items-center gap-2 rounded-md border px-2 py-1">
              <input
                type="color"
                value={style.backgroundColor}
                onChange={(e) => set("backgroundColor", e.target.value.toUpperCase())}
                className="h-5 w-5 cursor-pointer rounded border bg-transparent p-0"
              />
              <input
                value={style.backgroundColor}
                onChange={(e) => set("backgroundColor", e.target.value)}
                className="w-20 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <Separator />

          {/* Background image */}
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm">Background image</Label>
            <Switch
              checked={style.backgroundImageOn}
              onCheckedChange={(v) => set("backgroundImageOn", v)}
            />
          </div>

          {style.backgroundImageOn && (
            <>
              <div className="flex gap-4">
                <div className="h-20 w-20 shrink-0 rounded border bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:12px_12px]" />
                <div className="text-xs text-muted-foreground">
                  <p>Resolution:</p>
                  <p className="mt-1">Size:</p>
                </div>
              </div>
              <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                Add image
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () =>
                      typeof reader.result === "string" && set("imageUrl", reader.result);
                    reader.readAsDataURL(file);
                  }}
                />
              </label>

              <div>
                <Label className="text-sm">Embed from a URL</Label>
                <div className="mt-2 flex">
                  <Input
                    value={style.imageUrl}
                    onChange={(e) => set("imageUrl", e.target.value)}
                    placeholder="Enter image URL"
                    className="rounded-r-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none border-l-0"
                    onClick={() =>
                      style.imageUrl
                        ? toast.success("Background image applied")
                        : toast.error("Enter an image URL")
                    }
                  >
                    Go
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Images are not recognized by some email clients. You should also choose your
                  fallback background color. In some versions of email clients such as Outlook for
                  Windows, the background image will always be repeated.
                  <br />
                  <span className="text-primary underline">
                    How to add a message background image
                  </span>
                </p>
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="theme">
        <AccordionTrigger className="px-3 text-sm">
          Theme
          <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
            NEW
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-5">
          <ThemePanel onApply={(backgroundColor) => set("backgroundColor", backgroundColor)} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="header">
        <AccordionTrigger className="px-3 text-sm">Header</AccordionTrigger>
        <AccordionContent className="px-3 pb-5">
          <HeaderPanel value={header} onChange={setHeader} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="footer">
        <AccordionTrigger className="px-3 text-sm">Footer</AccordionTrigger>
        <AccordionContent className="px-3 pb-5">
          <FooterPanel value={footer} onChange={setFooter} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="css">
        <AccordionTrigger className="px-3 text-sm">Custom CSS</AccordionTrigger>
        <AccordionContent className="px-3 pb-4">
          <Textarea
            rows={5}
            value={style.customCss}
            onChange={(e) => set("customCss", e.target.value)}
            placeholder=".my-class { color: #333; }"
            className="font-mono text-xs"
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

type HeaderSettings = {
  showViewOnline: boolean;
  mode: "online" | "logo";
  imageUrl: string;
  altText: string;
  alignment: "left" | "center" | "right";
  width: number;
  height: number;
  padChangeIndividually: boolean;
  padAll: number;
  backgroundColor: string;
  transparent: boolean;
  visibility: "all" | "mobile" | "desktop";
};

function Stepper({
  value,
  onChange,
  min = 0,
  max = 2000,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="px-2 py-1 text-muted-foreground hover:bg-muted"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-14 border-x bg-transparent py-1 text-center text-sm outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="px-2 py-1 text-muted-foreground hover:bg-muted"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function HeaderPanel({
  value: h,
  onChange: setH,
}: {
  value: HeaderSettings;
  onChange: React.Dispatch<React.SetStateAction<HeaderSettings>>;
}) {
  const set = <K extends keyof HeaderSettings>(k: K, v: HeaderSettings[K]) =>
    setH((s) => ({ ...s, [k]: v }));

  const aligns = [
    { key: "left", icon: AlignLeft },
    { key: "center", icon: AlignCenter },
    { key: "right", icon: AlignRight },
  ] as const;

  const visibilities = [
    { key: "all", label: "All devices", icon: Monitor },
    { key: "mobile", label: "Mobile only", icon: Smartphone },
    { key: "desktop", label: "Desktop only", icon: Mail },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Mode radios */}
      <div className="space-y-2">
        {(
          [
            { key: "online", label: 'Show "View online" link' },
            { key: "logo", label: "Show logo" },
          ] as const
        ).map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => set("mode", o.key)}
            className="flex w-full items-center gap-2 text-left text-sm"
          >
            <span
              className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                h.mode === o.key ? "border-primary" : "border-muted-foreground/40"
              }`}
            >
              {h.mode === o.key && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <span className={h.mode === o.key ? "text-foreground" : "text-muted-foreground"}>
              {o.label}
            </span>
          </button>
        ))}
      </div>

      {h.mode === "logo" && (
        <>
          <LogoUploader
            value={h.imageUrl}
            alt={h.altText}
            onChange={(url: string) => set("imageUrl", url)}
          />



          <div>
            <Label className="text-sm">Alternative text</Label>
            <Input
              value={h.altText}
              onChange={(e) => set("altText", e.target.value)}
              placeholder="Enter alternative text"
              className="mt-2"
            />
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              Add alternative text in place of a video or image that doesn't load. It's most useful
              for people using screen readers.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm">Logo alignment</Label>
            <div className="flex overflow-hidden rounded-md border">
              {aligns.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => set("alignment", a.key)}
                  className={`px-2 py-1.5 ${
                    h.alignment === a.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <a.icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm">Width:</Label>
              <Stepper value={h.width} onChange={(v) => set("width", v)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm">Height:</Label>
              <Stepper value={h.height} onChange={(v) => set("height", v)} />
            </div>
            <button
              type="button"
              onClick={() => setH((s) => ({ ...s, width: 120, height: 40 }))}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Redo2 className="h-3.5 w-3.5" /> Restore original size
            </button>
          </div>

          <Separator />
        </>
      )}

      <div className="space-y-3">
        <Label className="text-sm">Logo padding</Label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Change individually</span>
          <Switch
            checked={h.padChangeIndividually}
            onCheckedChange={(v) => set("padChangeIndividually", v)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">All</span>
          <Stepper value={h.padAll} onChange={(v) => set("padAll", v)} max={100} />
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">Background color</Label>
        <button
          type="button"
          onClick={() => set("transparent", !h.transparent)}
          className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
        >
          <span className="relative h-5 w-5 overflow-hidden rounded border">
            {h.transparent ? (
              <span className="absolute inset-0 bg-[linear-gradient(to_top_right,transparent_45%,hsl(var(--destructive))_45%,hsl(var(--destructive))_55%,transparent_55%)]" />
            ) : (
              <span className="absolute inset-0" style={{ backgroundColor: h.backgroundColor }} />
            )}
          </span>
          {h.transparent ? "Transparent" : h.backgroundColor}
        </button>
      </div>

      <Separator />

      <div>
        <Label className="text-sm">Visibility</Label>
        <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-md border">
          {visibilities.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => set("visibility", v.key)}
              className={`flex flex-col items-center gap-1 py-2 text-[10px] transition ${
                h.visibility === v.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <v.icon className="h-4 w-4" />
              {v.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            Some older versions of Outlook, such as Windows Mail and desktop versions 2007 to 2019
            don't fully support responsive emails. Blocks hidden on mobile devices might still
            appear in some Outlook versions.
          </p>
        </div>
      </div>
    </div>
  );
}

type FooterSettings = {
  fontFamily: string;
  fontSize: string;
  textColor: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  alignment: "left" | "center" | "right";
  linksColor: string;
  backgroundColor: string;
  transparent: boolean;
  padChangeIndividually: boolean;
  padAll: number;
};

const FOOTER_FONTS = [
  "Arial",
  "Verdana",
  "Georgia",
  "Tahoma",
  "Times New Roman",
  "Courier New",
  "Trebuchet MS",
];
const FOOTER_SIZES = ["10", "11", "12", "14", "16", "18", "20"];

function FooterPanel({
  value: f,
  onChange: setF,
}: {
  value: FooterSettings;
  onChange: React.Dispatch<React.SetStateAction<FooterSettings>>;
}) {
  const set = <K extends keyof FooterSettings>(k: K, v: FooterSettings[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  const aligns = [
    { key: "left", icon: AlignLeft },
    { key: "center", icon: AlignCenter },
    { key: "right", icon: AlignRight },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-md bg-muted/60 p-3">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="space-y-2 text-[11px] leading-snug text-muted-foreground">
          <p>
            You cannot remove or hide the unsubscribe link or any other footer element required by
            consumer privacy and anti-spam laws.
          </p>
          <p>The physical address displayed in the footer is taken from the linked list.</p>
          <button type="button" className="font-medium text-primary hover:underline">
            Learn more about footer requirements
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Text style</Label>
        <div className="flex items-center gap-2">
          <select
            value={f.fontFamily}
            onChange={(e) => set("fontFamily", e.target.value)}
            className="h-9 flex-1 rounded-md border bg-background px-2 text-sm outline-none"
          >
            {FOOTER_FONTS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            value={f.fontSize}
            onChange={(e) => set("fontSize", e.target.value)}
            className="h-9 w-16 rounded-md border bg-background px-2 text-sm outline-none"
          >
            {FOOTER_SIZES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border px-2">
            <span className="h-5 w-5 rounded-sm border" style={{ backgroundColor: f.textColor }} />
            <span className="text-xs">{f.textColor.toUpperCase()}</span>
            <input
              type="color"
              value={f.textColor}
              onChange={(e) => set("textColor", e.target.value)}
              className="sr-only"
            />
          </label>
        </div>
        <div className="flex overflow-hidden rounded-md border">
          {(
            [
              { key: "bold", label: "B", cls: "font-bold" },
              { key: "italic", label: "I", cls: "italic" },
              { key: "underline", label: "U", cls: "underline" },
            ] as const
          ).map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => set(b.key, !f[b.key])}
              className={`w-10 py-1.5 text-sm ${b.cls} ${
                f[b.key]
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">Alignment</Label>
        <div className="flex overflow-hidden rounded-md border">
          {aligns.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => set("alignment", a.key)}
              className={`px-2 py-1.5 ${
                f.alignment === a.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <a.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">Links color</Label>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1">
          <span className="h-5 w-5 rounded-sm border" style={{ backgroundColor: f.linksColor }} />
          <span className="text-sm">{f.linksColor.toUpperCase()}</span>
          <input
            type="color"
            value={f.linksColor}
            onChange={(e) => set("linksColor", e.target.value)}
            className="sr-only"
          />
        </label>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">Background color</Label>
        <button
          type="button"
          onClick={() => set("transparent", !f.transparent)}
          className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
        >
          <span className="relative h-5 w-5 overflow-hidden rounded border">
            {f.transparent ? (
              <span className="absolute inset-0 bg-[linear-gradient(to_top_right,transparent_45%,hsl(var(--destructive))_45%,hsl(var(--destructive))_55%,transparent_55%)]" />
            ) : (
              <span className="absolute inset-0" style={{ backgroundColor: f.backgroundColor }} />
            )}
          </span>
          {f.transparent ? "Transparent" : f.backgroundColor.toUpperCase()}
        </button>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm">Padding</Label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Change individually</span>
          <Switch
            checked={f.padChangeIndividually}
            onCheckedChange={(v) => set("padChangeIndividually", v)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">All</span>
          <Stepper value={f.padAll} onChange={(v) => set("padAll", v)} max={100} />
        </div>
      </div>
    </div>
  );
}

type BrandColor = { label: string; value: string; hint?: boolean };

function ThemePanel({ onApply }: { onApply: (backgroundColor: string) => void }) {
  const [creating, setCreating] = useState(false);
  const [section, setSection] = useState<"colors" | "typography">("colors");
  const [colors, setColors] = useState<BrandColor[]>([
    { label: "Background", value: "#FFFFFF" },
    { label: "Text", value: "#202730" },
    { label: "Button", value: "#004291" },
    { label: "Accent color #1", value: "#F6F6F6", hint: true },
    { label: "Accent color #2", value: "#D8F3FF", hint: true },
  ]);
  const [typography, setTypography] = useState({ heading: "Space Grotesk", body: "Inter" });

  if (!creating) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Brand kit</h4>
        <p className="text-xs leading-snug text-muted-foreground">
          You don't have a brand kit yet. Create one to save your colors and fonts and apply them to
          your designs.
        </p>
        <div className="flex justify-center pt-1">
          <Button variant="outline" className="rounded-full px-6" onClick={() => setCreating(true)}>
            Create brand kit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/60 p-2">
        {(
          [
            { key: "colors", label: "Brand colors" },
            { key: "typography", label: "Brand typography" },
          ] as const
        ).map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`block w-full rounded px-2 py-1.5 text-left text-sm transition ${
              section === s.key
                ? "border-l-2 border-primary bg-background font-semibold text-foreground"
                : "text-primary hover:bg-background/60"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "colors" ? (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            Brand colors
            <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
              BETA
            </span>
          </h4>
          {colors.map((c, i) => (
            <div key={c.label} className="flex items-center justify-between gap-2">
              <Label className="flex items-center gap-1 text-xs">
                {c.label}
                {c.hint && <Info className="h-3 w-3 text-muted-foreground" />}
              </Label>
              <div className="flex items-center gap-2 rounded-full border px-1 py-1">
                <input
                  type="color"
                  value={c.value}
                  onChange={(e) =>
                    setColors((s) =>
                      s.map((x, xi) =>
                        xi === i ? { ...x, value: e.target.value.toUpperCase() } : x,
                      ),
                    )
                  }
                  className="h-5 w-5 cursor-pointer rounded-full border bg-transparent p-0"
                />
                <input
                  value={c.value}
                  onChange={(e) =>
                    setColors((s) =>
                      s.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)),
                    )
                  }
                  className="w-20 bg-transparent text-xs outline-none"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setColors((s) => [...s, { label: `Custom color #${s.length - 4}`, value: "#CCCCCC" }])
            }
            className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium text-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Add more colors
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Brand typography</h4>
          <div>
            <Label className="text-xs">Heading font</Label>
            <Input
              value={typography.heading}
              onChange={(e) => setTypography((s) => ({ ...s, heading: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Body font</Label>
            <Input
              value={typography.body}
              onChange={(e) => setTypography((s) => ({ ...s, body: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-full px-5"
          onClick={() => {
            onApply(colors[0]?.value ?? "#FFFFFF");
            toast.success("Brand kit saved and applied");
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function LogoUploader({
  value,
  alt,
  onChange,
}: {
  value: string;
  alt: string;
  onChange: (url: string) => void;
}) {
  const [urlDraft, setUrlDraft] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [meta, setMeta] = useState<{ resolution: string; size: string }>({
    resolution: "—",
    size: "—",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const img = new Image();
      img.onload = () =>
        setMeta({
          resolution: `${img.naturalWidth} × ${img.naturalHeight} px`,
          size: `${(file.size / 1024).toFixed(0)} KB`,
        });
      img.src = reader.result;
      onChange(reader.result);
      toast.success("Logo uploaded");
    };
    reader.onerror = () => toast.error("Could not read the file");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border bg-[repeating-linear-gradient(45deg,hsl(var(--muted))_0_6px,transparent_6px_12px)]">
          {value ? (
            <img src={value} alt={alt || "Logo preview"} className="max-h-full max-w-full object-contain" />
          ) : null}
        </div>
        <div className="text-xs text-muted-foreground">
          <p>Resolution: {value ? meta.resolution : "—"}</p>
          <p className="mt-1">Size: {value ? meta.size : "—"}</p>
          {value ? (
            <button
              type="button"
              className="mt-2 text-destructive hover:underline"
              onClick={() => {
                onChange("");
                setMeta({ resolution: "—", size: "—" });
              }}
            >
              Remove logo
            </button>
          ) : null}
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          readFile(e.dataTransfer.files?.[0]);
        }}
        className={`cursor-pointer rounded-md border border-dashed p-4 text-center text-xs transition-colors ${
          dragOver ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"
        }`}
      >
        <p className="font-medium text-foreground">
          {value ? "Replace image" : "Upload image from your device"}
        </p>
        <p className="mt-1">Drag &amp; drop or click to browse — PNG, JPG, GIF, SVG up to 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            readFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      <div>
        <Label className="text-sm">Embed from a URL</Label>
        <div className="mt-2 flex">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (!urlDraft.trim()) return toast.error("Enter an image URL");
              onChange(urlDraft.trim());
              setMeta({ resolution: "—", size: "—" });
              toast.success("Logo updated");
            }}
            placeholder="Enter image URL"
            className="rounded-r-none"
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-l-none border-l-0"
            onClick={() => {
              if (!urlDraft.trim()) return toast.error("Enter an image URL");
              onChange(urlDraft.trim());
              setMeta({ resolution: "—", size: "—" });
              toast.success("Logo updated");
            }}
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  );
}
