
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

function HeaderPanel() {
  const [h, setH] = useState<HeaderSettings>({
    showViewOnline: false,
    mode: "logo",
    imageUrl: "",
    altText: "",
    alignment: "center",
    width: 120,
    height: 40,
    padChangeIndividually: false,
    padAll: 5,
    backgroundColor: "#FFFFFF",
    transparent: true,
    visibility: "all",
  });
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
          <div className="flex gap-4">
            <div className="h-20 w-20 shrink-0 rounded border bg-[repeating-linear-gradient(45deg,hsl(var(--muted))_0_6px,transparent_6px_12px)]" />
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
                value={h.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="Enter image URL"
                className="rounded-r-none"
              />
              <Button variant="outline" className="rounded-l-none border-l-0">
                Go
              </Button>
            </div>
          </div>

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

type BrandColor = { label: string; value: string; hint?: boolean };

function ThemePanel() {
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
                    setColors((s) => s.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))
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
        <Button size="sm" className="rounded-full px-5" onClick={() => toast.success("Brand kit saved")}>
          Save
        </Button>
      </div>
    </div>
  );
}
