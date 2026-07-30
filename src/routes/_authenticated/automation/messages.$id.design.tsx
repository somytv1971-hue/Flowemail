import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAutomationMessage,
  updateAutomationMessage,
} from "@/lib/automation-messages.functions";
import { MESSAGE_CATEGORIES, MESSAGE_TEMPLATES, type MessageTemplate } from "@/lib/message-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, Search, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/automation/messages/$id/design")({
  head: () => ({
    meta: [
      { title: "Design and content — Flowmail" },
      { name: "description", content: "Pick a predesigned email template or write your own HTML." },
      { property: "og:title", content: "Design and content — Flowmail" },
      {
        property: "og:description",
        content: "Pick a predesigned email template or write your own HTML.",
      },
    ],
  }),
  component: DesignPage,
});

const BLANK_TEMPLATES = [
  { id: "1col", label: "1 column" },
  { id: "3col", label: "3 columns" },
  { id: "2col", label: "2 columns" },
  { id: "blank", label: "Blank template" },
];

function TemplateThumb({ t }: { t: MessageTemplate }) {
  const bar = { background: t.accent };
  return (
    <div
      className="flex h-[330px] flex-col gap-2 p-4"
      style={{ background: `linear-gradient(160deg, ${t.from}, ${t.to})` }}
    >
      <div className="mx-auto h-2 w-12 rounded-full bg-background/70" />
      {t.layout === "hero" && (
        <>
          <div className="mt-2 h-28 rounded-lg bg-background/85" />
          <div className="mt-3 h-3 w-3/4 rounded bg-background/80" />
          <div className="h-2 w-full rounded bg-background/60" />
          <div className="h-2 w-5/6 rounded bg-background/60" />
          <div className="mt-3 h-7 w-28 rounded-full" style={bar} />
        </>
      )}
      {t.layout === "product" && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="h-24 rounded-lg bg-background/85" />
            <div className="h-24 rounded-lg bg-background/85" />
            <div className="h-24 rounded-lg bg-background/85" />
            <div className="h-24 rounded-lg bg-background/85" />
          </div>
          <div className="mt-auto h-7 w-full rounded-full" style={bar} />
        </>
      )}
      {t.layout === "promo" && (
        <>
          <div className="mt-6 h-10 w-full rounded bg-background/85" />
          <div className="h-6 w-2/3 rounded bg-background/70" />
          <div className="mt-4 h-24 rounded-lg bg-background/85" />
          <div className="mt-auto h-8 w-32 rounded-full" style={bar} />
        </>
      )}
      {t.layout === "text" && (
        <div className="mt-4 space-y-2">
          <div className="h-3 w-2/3 rounded bg-background/85" />
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-2 rounded bg-background/55"
              style={{ width: `${70 + ((i * 13) % 30)}%` }}
            />
          ))}
          <div className="mt-4 h-7 w-24 rounded-full" style={bar} />
        </div>
      )}
      {t.layout === "grid" && (
        <>
          <div className="mt-2 h-20 rounded-lg bg-background/85" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 rounded bg-background/80" />
            <div className="h-16 rounded bg-background/80" />
            <div className="h-16 rounded bg-background/80" />
          </div>
          <div className="mt-2 h-2 w-full rounded bg-background/60" />
          <div className="h-2 w-4/5 rounded bg-background/60" />
          <div className="mt-auto h-7 w-full rounded-full" style={bar} />
        </>
      )}
    </div>
  );
}

function DesignPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getAutomationMessage);
  const update = useServerFn(updateAutomationMessage);

  const { data: msg } = useQuery({
    queryKey: ["automation-message", id],
    queryFn: () => get({ data: { id } }),
  });

  const [html, setHtml] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("All templates");
  const [search, setSearch] = useState("");

  const templates = useMemo(
    () =>
      MESSAGE_TEMPLATES.filter(
        (t) =>
          (category === "All templates" || t.category === category) &&
          t.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [category, search],
  );

  const save = useMutation({
    mutationFn: (patch: any) => update({ data: { id, ...patch } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-message", id] });
      toast.success("Design saved");
      navigate({ to: "/automation/messages/$id", params: { id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save"),
  });

  return (
    <div className="pb-12">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => navigate({ to: "/automation/messages/$id", params: { id } })}
          className="absolute left-0 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-display text-2xl font-semibold">Design and content</h1>
      </div>

      <Tabs defaultValue="predesigned" className="mt-8">
        <TabsList className="mx-auto">
          <TabsTrigger value="predesigned">Predesigned templates</TabsTrigger>
          <TabsTrigger value="mine">My templates</TabsTrigger>
          <TabsTrigger value="blank">Blank templates</TabsTrigger>
          <TabsTrigger value="html">HTML editor</TabsTrigger>
          <TabsTrigger value="existing">Existing messages</TabsTrigger>
        </TabsList>

        <TabsContent value="predesigned" className="mt-8">
          <div className="flex gap-8">
            <aside className="hidden w-52 shrink-0 lg:block">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categories
              </p>
              <nav className="space-y-1">
                {MESSAGE_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      category === c
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-64 rounded-full pl-8"
                  />
                </div>
                <span className="ml-auto text-sm text-muted-foreground">
                  {templates.length} templates
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className={`group overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md ${
                      msg?.layout === t.id ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="relative">
                      <TemplateThumb t={t} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-foreground/60 opacity-0 transition group-hover:opacity-100">
                        <Button
                          className="rounded-full"
                          onClick={() => save.mutate({ layout: t.id })}
                          disabled={save.isPending}
                        >
                          Use template
                        </Button>
                        <Button variant="secondary" size="sm" className="rounded-full">
                          <Eye className="mr-1 h-4 w-4" /> Preview
                        </Button>
                      </div>
                    </div>
                    <div className="border-t px-3 py-3">
                      <div className="truncate text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.category}</div>
                    </div>
                  </div>
                ))}
              </div>

              {templates.length === 0 && (
                <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground shadow-sm">
                  No templates match your search.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="blank" className="mt-8">
          <div className="mb-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <span>Sort by</span>
            <span className="font-medium text-primary">Created on</span>
            <Search className="h-4 w-4" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BLANK_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => save.mutate({ layout: t.id })}
                className={`group overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:shadow-md ${
                  msg?.layout === t.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="h-64 bg-background p-5">
                  <div className="mx-auto mb-4 h-3 w-10 rounded bg-muted" />
                  {t.id !== "blank" && (
                    <>
                      <div className="mb-3 h-20 rounded bg-muted" />
                      <div className="space-y-1.5">
                        <div className="h-2 rounded bg-muted" />
                        <div className="h-2 w-5/6 rounded bg-muted" />
                      </div>
                      <div
                        className={`mt-4 grid gap-2 ${
                          t.id === "3col" ? "grid-cols-3" : t.id === "2col" ? "grid-cols-2" : ""
                        }`}
                      >
                        {Array.from({ length: t.id === "3col" ? 3 : t.id === "2col" ? 2 : 0 }).map(
                          (_, i) => (
                            <div key={i} className="h-14 rounded bg-muted" />
                          ),
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="border-t py-3 text-center text-sm text-muted-foreground">
                  {t.label}
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="html" className="mt-8">
          <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 shadow-sm">
            <Textarea
              rows={16}
              className="font-mono text-sm"
              placeholder="<html>…</html>"
              value={html ?? msg?.content_html ?? ""}
              onChange={(e) => setHtml(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <Button
                className="rounded-full"
                onClick={() => save.mutate({ layout: "html", content_html: html ?? "" })}
              >
                Save HTML
              </Button>
            </div>
          </div>
        </TabsContent>

        {["mine", "existing"].map((v) => (
          <TabsContent key={v} value={v} className="mt-8">
            <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Coming in the next release.</p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
