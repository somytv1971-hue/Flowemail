import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Eraser,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Link2Off,
  Baseline,
  Highlighter,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BLOCKS = [
  { label: "Paragraph", value: "P" },
  { label: "Heading 1", value: "H1" },
  { label: "Heading 2", value: "H2" },
  { label: "Heading 3", value: "H3" },
  { label: "Quote", value: "BLOCKQUOTE" },
];

const FONTS = ["Arial", "Helvetica", "Georgia", "Tahoma", "Times New Roman", "Verdana", "Courier New"];

const SIZES: Array<[string, string]> = [
  ["10", "1"],
  ["12", "2"],
  ["14", "3"],
  ["18", "4"],
  ["24", "5"],
  ["32", "6"],
  ["48", "7"],
];

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc", "#ffffff",
  "#e11d48", "#f97316", "#eab308", "#22c55e", "#0ea5e9", "#6366f1",
  "#a855f7", "#ec4899", "#14b8a6", "#84cc16", "#f43f5e", "#1e293b",
];

const EMOJIS = ["😀", "😍", "🎉", "🔥", "✅", "⭐", "💡", "🚀", "❤️", "👍", "🎁", "📣"];

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

/** Formatting bar shown while a text block is being edited. */
export function RichTextToolbar() {
  const [state, setState] = useState({ bold: false, italic: false, underline: false, strike: false });

  useEffect(() => {
    const sync = () => {
      try {
        setState({
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          underline: document.queryCommandState("underline"),
          strike: document.queryCommandState("strikeThrough"),
        });
      } catch {
        /* ignore */
      }
    };
    document.addEventListener("selectionchange", sync);
    return () => document.removeEventListener("selectionchange", sync);
  }, []);

  const hold = (event: React.MouseEvent) => event.preventDefault();

  const IconBtn = ({
    title,
    active,
    onClick,
    children,
  }: {
    title: string;
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={hold}
      onClick={onClick}
      className={`h-8 w-8 ${active ? "bg-accent text-accent-foreground" : ""}`}
    >
      {children}
    </Button>
  );

  const Divider = () => <span className="mx-1 h-5 w-px bg-border" />;

  return (
    <div className="sticky top-0 z-20 mb-4 flex flex-wrap items-center gap-0.5 rounded-lg border bg-card px-2 py-1.5 shadow-sm">
      <select
        aria-label="Text style"
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => exec("formatBlock", `<${e.target.value}>`)}
        defaultValue="P"
        className="h-8 rounded border bg-background px-2 text-xs"
      >
        {BLOCKS.map((b) => (
          <option key={b.value} value={b.value}>
            {b.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Font family"
        onChange={(e) => exec("fontName", e.target.value)}
        defaultValue="Arial"
        className="ml-1 h-8 rounded border bg-background px-2 text-xs"
      >
        {FONTS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <select
        aria-label="Font size"
        onChange={(e) => exec("fontSize", e.target.value)}
        defaultValue="3"
        className="ml-1 h-8 rounded border bg-background px-2 text-xs"
      >
        {SIZES.map(([label, value]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <Divider />
      <IconBtn title="Bold" active={state.bold} onClick={() => exec("bold")}>
        <Bold className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Italic" active={state.italic} onClick={() => exec("italic")}>
        <Italic className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Underline" active={state.underline} onClick={() => exec("underline")}>
        <Underline className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Strikethrough" active={state.strike} onClick={() => exec("strikeThrough")}>
        <Strikethrough className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Subscript" onClick={() => exec("subscript")}>
        <Subscript className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Superscript" onClick={() => exec("superscript")}>
        <Superscript className="h-4 w-4" />
      </IconBtn>

      <Divider />
      <ColorPicker title="Text color" icon={<Baseline className="h-4 w-4" />} command="foreColor" />
      <ColorPicker
        title="Highlight color"
        icon={<Highlighter className="h-4 w-4" />}
        command="hiliteColor"
      />
      <IconBtn title="Clear formatting" onClick={() => exec("removeFormat")}>
        <Eraser className="h-4 w-4" />
      </IconBtn>

      <Divider />
      <IconBtn title="Bulleted list" onClick={() => exec("insertUnorderedList")}>
        <List className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Numbered list" onClick={() => exec("insertOrderedList")}>
        <ListOrdered className="h-4 w-4" />
      </IconBtn>

      <Divider />
      <IconBtn title="Align left" onClick={() => exec("justifyLeft")}>
        <AlignLeft className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Align center" onClick={() => exec("justifyCenter")}>
        <AlignCenter className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Align right" onClick={() => exec("justifyRight")}>
        <AlignRight className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Justify" onClick={() => exec("justifyFull")}>
        <AlignJustify className="h-4 w-4" />
      </IconBtn>

      <Divider />
      <IconBtn
        title="Insert link"
        onClick={() => {
          const url = window.prompt("Link URL", "https://");
          if (url) exec("createLink", url);
        }}
      >
        <Link2 className="h-4 w-4" />
      </IconBtn>
      <IconBtn title="Remove link" onClick={() => exec("unlink")}>
        <Link2Off className="h-4 w-4" />
      </IconBtn>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Insert emoji"
            aria-label="Insert emoji"
            onMouseDown={hold}
            className="h-8 w-8"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="grid w-48 grid-cols-6 gap-1 p-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onMouseDown={hold}
              onClick={() => exec("insertText", emoji)}
              className="rounded p-1 text-base hover:bg-accent"
            >
              {emoji}
            </button>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ColorPicker({
  title,
  icon,
  command,
}: {
  title: string;
  icon: React.ReactNode;
  command: "foreColor" | "hiliteColor";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={title}
          aria-label={title}
          onMouseDown={(e) => e.preventDefault()}
          className="h-8 w-8"
        >
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto p-2">
        <div className="grid grid-cols-6 gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec(command, color)}
              className="h-5 w-5 rounded border"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <DropdownMenuItem
          onMouseDown={(e) => e.preventDefault()}
          onSelect={(e) => {
            e.preventDefault();
            exec(command, "transparent");
          }}
          className="mt-2 justify-center text-xs"
        >
          None
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
