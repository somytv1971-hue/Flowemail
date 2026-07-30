import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAutomationMessage,
  updateAutomationMessage,
} from "@/lib/automation-messages.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/automation/messages/$id/design")({
  head: () => ({
    meta: [
      { title: "Design and content — Flowmail" },
      { name: "description", content: "Pick a layout or write HTML for your automation message." },
      { property: "og:title", content: "Design and content — Flowmail" },
      {
        property: "og:description",
        content: "Pick a layout or write HTML for your automation message.",
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

      <Tabs defaultValue="blank" className="mt-8">
        <TabsList className="mx-auto">
          <TabsTrigger value="predesigned">Predesigned templates</TabsTrigger>
          <TabsTrigger value="mine">My templates</TabsTrigger>
          <TabsTrigger value="blank">Blank templates</TabsTrigger>
          <TabsTrigger value="html">HTML editor</TabsTrigger>
          <TabsTrigger value="existing">Existing messages</TabsTrigger>
        </TabsList>

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

        {["predesigned", "mine", "existing"].map((v) => (
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
