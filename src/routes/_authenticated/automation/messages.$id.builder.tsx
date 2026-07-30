import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAutomationMessage,
  updateAutomationMessage,
} from "@/lib/automation-messages.functions";
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

type Block = { key: string; type: BlockType };

function BlockPreview({ type }: { type: BlockType }) {
  switch (type) {
    case "image":
      return (
        <div className="flex h-32 items-center justify-center rounded bg-muted text-muted-foreground">
          <ImageIcon className="h-6 w-6" />
        </div>
      );
    case "text":
      return (
        <p className="text-sm leading-relaxed text-foreground">
          Write your message here. Click to edit this text block and tell your subscribers what
          matters.
        </p>
      );
    case "button":
      return (
        <div className="flex justify-center">
          <span className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground">
            Click here
          </span>
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
          {"<div>Custom HTML</div>"}
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
  const [tab, setTab] = useState<"layout" | "style">("layout");
  const [dragOver, setDragOver] = useState(false);
  const [style, setStyle] = useState<MessageStyle>({
    width: 600,
    backgroundColor: "#FFFFFF",
    backgroundImageOn: true,
    imageUrl: "",
    customCss: "",
  });

  const addBlock = (type: BlockType, index?: number) => {
    const block = { key: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type };
    setBlocks((b) => {
      const next = [...b];
      next.splice(index ?? next.length, 0, block);
      return next;
    });
    setSelected(block.key);
  };

  const save = useMutation({
    mutationFn: () =>
      update({
        data: {
          id,
          content_html: blocks.map((b) => `<!-- block:${b.type} -->`).join("\n"),
        },
      }),
    onSuccess: () => toast.success("Saved"),
    onError: (e: any) => toast.error(e.message ?? "Could not save"),
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
          <Undo2 className="h-4 w-4" />
          <Redo2 className="h-4 w-4" />
          <span className="ml-2 inline-flex items-center gap-1 text-xs">
            <Save className="h-3.5 w-3.5" /> {save.isPending ? "Saving…" : "Saved"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button type="button" className="text-sm font-medium text-primary hover:underline">
            Test and preview
          </button>
          <button
            type="button"
            onClick={() => save.mutate()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Save and exit
          </button>
          <Button
            className="rounded-full px-6"
            onClick={() =>
              save.mutate(undefined, {
                onSuccess: () =>
                  navigate({ to: "/automation/messages/$id", params: { id } }),
              })
            }
          >
            Next
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Canvas */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-muted/40 p-8">
          <div className="mx-auto max-w-xl">
            <div className="mx-auto mb-6 w-32 rounded border border-dashed bg-card py-2 text-center text-xs tracking-widest text-muted-foreground">
              LOGO
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
                if (type) addBlock(type);
              }}
              className={`rounded-lg border-2 border-dashed bg-card p-4 transition ${
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
                  {blocks.map((b) => (
                    <div
                      key={b.key}
                      onClick={() => setSelected(b.key)}
                      className={`group relative rounded border p-4 transition ${
                        selected === b.key
                          ? "border-primary ring-1 ring-primary"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      <BlockPreview type={b.type} />
                      <div className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBlocks((s) => s.filter((x) => x.key !== b.key));
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

            <footer className="mt-6 space-y-1 text-center text-[11px] text-muted-foreground">
              <p>{msg?.list_name || "Your company"}, 1700, Business street, City, Country</p>
              <p>
                You can{" "}
                <span className="text-primary underline">unsubscribe</span> or{" "}
                <span className="text-primary underline">change your details</span> at any time.
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
                      <div
                        key={s}
                        className="rounded-lg border p-3 text-center text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

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
            <MessageStylePanel style={style} setStyle={setStyle} />
          )}
        </aside>
      </div>
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
}: {
  style: MessageStyle;
  setStyle: React.Dispatch<React.SetStateAction<MessageStyle>>;
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
              <button type="button" className="text-sm font-medium text-primary hover:underline">
                Add image
              </button>

              <div>
                <Label className="text-sm">Embed from a URL</Label>
                <div className="mt-2 flex">
                  <Input
                    value={style.imageUrl}
                    onChange={(e) => set("imageUrl", e.target.value)}
                    placeholder="Enter image URL"
                    className="rounded-r-none"
                  />
                  <Button variant="outline" className="rounded-l-none border-l-0">
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
        <AccordionContent className="px-3 pb-4 text-xs text-muted-foreground">
          Pick a theme to apply consistent colors and fonts across the whole message.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="header">
        <AccordionTrigger className="px-3 text-sm">Header</AccordionTrigger>
        <AccordionContent className="px-3 pb-4 text-xs text-muted-foreground">
          Configure the header area shown above your message content.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="footer">
        <AccordionTrigger className="px-3 text-sm">Footer</AccordionTrigger>
        <AccordionContent className="px-3 pb-4 text-xs text-muted-foreground">
          Configure the footer, address block and unsubscribe links.
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
