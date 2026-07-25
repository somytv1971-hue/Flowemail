import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ChevronLeft, Search, Plus, Mail, Monitor, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateWorkflowDialog } from "@/components/create-workflow-dialog";
import { createWorkflow } from "@/lib/workflows.functions";
import { TEMPLATES, TEMPLATE_CATEGORIES, type Template } from "@/lib/workflow-templates";

export const Route = createFileRoute("/_authenticated/automation/workflows/new")({
  head: () => ({
    meta: [
      { title: "Choose a template — Flowmail" },
      { name: "description", content: "Start a new workflow from a template or from scratch." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const navigate = useNavigate();
  const create = useServerFn(createWorkflow);
  const [category, setCategory] = useState<string>("All templates");
  const [query, setQuery] = useState("");
  const [scratchOpen, setScratchOpen] = useState(false);

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const inCat = category === "All templates" || t.category === category;
      const inQuery = !query || t.name.toLowerCase().includes(query.toLowerCase());
      return inCat && inQuery;
    });
  }, [category, query]);

  const useTemplate = useMutation({
    mutationFn: (t: Template) =>
      create({
        data: { name: t.name, channel: t.channel, start_element: t.start_element },
      }),
    onSuccess: (row: any) => {
      toast.success("Workflow created from template");
      navigate({ to: "/automation/workflows/$id", params: { id: row.id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create"),
  });

  return (
    <div className="-mx-6 -my-8 min-h-[calc(100vh-4rem)] bg-muted/30">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-card px-6 py-3 shadow-sm">
        <Button asChild variant="ghost" size="sm">
          <Link to="/automation">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="h-6 w-px bg-border" />
        <h1 className="font-display text-lg font-semibold">Pre-built templates</h1>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setScratchOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Create from scratch
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 p-6">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20 rounded-xl border bg-card p-2 shadow-sm">
            <nav className="space-y-0.5">
              {TEMPLATE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    category === c
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Search */}
          <div className="mb-6 flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-sm font-medium">What is your goal today? 🎯</div>
            <div className="relative ml-auto flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border bg-card p-16 text-center text-sm text-muted-foreground">
              No templates match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => (
                <TemplateCard
                  key={t.id}
                  t={t}
                  pending={useTemplate.isPending}
                  onUse={() => useTemplate.mutate(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateWorkflowDialog open={scratchOpen} onOpenChange={setScratchOpen} />
    </div>
  );
}

function TemplateCard({
  t,
  pending,
  onUse,
}: {
  t: Template;
  pending: boolean;
  onUse: () => void;
}) {
  const levelBadge = {
    basic: "bg-success/15 text-success",
    advanced: "bg-primary/15 text-primary",
    pro: "bg-warning/15 text-warning",
  }[t.level];

  const ChannelIcon = t.channel === "web" ? Monitor : Mail;

  return (
    <div className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-semibold leading-tight">{t.name}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${levelBadge}`}>
          {t.level}
        </span>
      </div>
      <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{t.description}</p>

      <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ChannelIcon className="h-3.5 w-3.5" />
          {t.channel === "web" ? "Web" : "Email"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" /> {t.category}
        </span>
      </div>

      <Button
        className="mt-4 w-full"
        variant="outline"
        onClick={onUse}
        disabled={pending}
      >
        Use template
      </Button>
    </div>
  );
}
