import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAutomationMessage,
  updateAutomationMessage,
} from "@/lib/automation-messages.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  CheckCircle2,
  Send,
  Type,
  Image as ImageIcon,
  Paperclip,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/automation/messages/$id/")({
  head: () => ({
    meta: [
      { title: "Automation message — Flowmail" },
      { name: "description", content: "Compose and configure your automation email message." },
      { property: "og:title", content: "Automation message — Flowmail" },
      {
        property: "og:description",
        content: "Compose and configure your automation email message.",
      },
    ],
  }),
  component: MessageEditor,
});

const LAYOUT_LABELS: Record<string, string> = {
  "1col": "1 column",
  "2col": "2 columns",
  "3col": "3 columns",
  blank: "Blank template",
};

function MessageEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getAutomationMessage);
  const update = useServerFn(updateAutomationMessage);

  const { data: msg, isLoading } = useQuery({
    queryKey: ["automation-message", id],
    queryFn: () => get({ data: { id } }),
  });

  const [form, setForm] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (msg && !form) setForm(msg);
  }, [msg, form]);

  const save = useMutation({
    mutationFn: (patch: any) => update({ data: { id, ...patch } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation-message", id] });
      qc.invalidateQueries({ queryKey: ["automation-messages"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save"),
  });

  if (isLoading || !form) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const payload = () => ({
    name: form.name,
    list_name: form.list_name,
    from_email: form.from_email,
    reply_to: form.reply_to,
    subject: form.subject,
    preview_text: form.preview_text,
    track_opens: form.track_opens,
    track_clicks: form.track_clicks,
  });

  const canFinish = form.subject?.trim() && form.from_email?.trim() && form.layout;

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <Link
        to="/automation"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Automation messages
      </Link>

      <div className="mt-4 divide-y rounded-2xl border bg-card shadow-sm">
        {/* Name */}
        <div className="p-8">
          <div className="flex items-start justify-between gap-4">
            {editingName ? (
              <Input
                autoFocus
                value={form.name}
                maxLength={128}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => setEditingName(false)}
                className="max-w-md text-xl font-semibold"
              />
            ) : (
              <h1 className="font-display text-2xl font-semibold">{form.name}</h1>
            )}
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => setEditingName((v) => !v)}
            >
              {editingName ? "Done" : "Edit name"}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {form.name.length}/128 characters. The name will appear on the list of your messages.
            Only you will see it.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Linked list</span>
            <Input
              value={form.list_name}
              onChange={(e) => set("list_name", e.target.value)}
              className="h-8 w-56"
            />
          </div>
        </div>

        {/* From / reply-to */}
        <div className="flex gap-6 p-8">
          <div className="pt-6">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-success/15 text-success">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="flex-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="from">"From" email address</Label>
                <Input
                  id="from"
                  className="mt-1.5"
                  value={form.from_email}
                  placeholder="you@yourdomain.com"
                  onChange={(e) => set("from_email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reply">Reply-to</Label>
                <Input
                  id="reply"
                  className="mt-1.5"
                  value={form.reply_to}
                  placeholder="you@yourdomain.com"
                  onChange={(e) => set("reply_to", e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-primary hover:underline"
              onClick={() => toast.info("Add more sender addresses in a later release.")}
            >
              Add another address
            </button>

            <div className="mt-4 flex gap-3 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p>
                Use an email address at a custom domain and authenticate it with DKIM. That ensures
                your "From" address meets inbox provider authentication requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="flex gap-6 p-8">
          <div className="pt-7 text-muted-foreground">
            <Type className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <Label htmlFor="subject" className="text-base">
              Subject line
            </Label>
            <Input
              id="subject"
              className="mt-2"
              maxLength={150}
              value={form.subject}
              placeholder="How do you want to stand out in the recipient's inbox?"
              onChange={(e) => set("subject", e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {form.subject.length}/150 characters. Keep it under 60 characters for mobile.
            </p>
            <div className="mt-3">
              <Label htmlFor="preview">Preview text</Label>
              <Textarea
                id="preview"
                className="mt-1.5"
                rows={2}
                value={form.preview_text}
                placeholder="Short text shown after the subject line in the inbox"
                onChange={(e) => set("preview_text", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Design & content */}
        <div className="flex gap-6 p-8">
          <div className="pt-1 text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-xl font-semibold">Design and content</h2>
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/automation/messages/$id/design" params={{ id }}>
                  Design message
                </Link>
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with a template or reuse content from an existing message. You can also use the
              HTML editor or start with a blank layout.
            </p>

            <div className="mt-5 flex flex-wrap items-start gap-8">
              <div className="w-52 rounded-lg border border-dashed p-4">
                <div className="grid h-28 place-items-center rounded bg-muted text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-2 rounded bg-muted" />
                  <div className="h-2 w-4/5 rounded bg-muted" />
                  <div className="h-2 w-3/5 rounded bg-muted" />
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {form.layout ? LAYOUT_LABELS[form.layout] ?? form.layout : "No layout chosen"}
                </p>
              </div>

              <div className="text-sm">
                <div className="text-muted-foreground">Attachments</div>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-2 font-medium text-primary hover:underline"
                  onClick={() => toast.info("Attachments arrive in a later release.")}
                >
                  <Paperclip className="h-4 w-4" /> Attach file
                </button>
                <span className="ml-2 text-muted-foreground">(Max size: 500 KB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking */}
        <div className="p-8">
          <h3 className="font-medium text-primary">Tracking</h3>
          <div className="mt-4 space-y-3">
            <ToggleRow
              label="Opens"
              checked={form.track_opens}
              onChange={(v) => set("track_opens", v)}
            />
            <ToggleRow
              label="Clicks"
              checked={form.track_clicks}
              onChange={(v) => set("track_clicks", v)}
            />
            <LockedRow label="Revenue attribution" />
            <LockedRow label="Site visitor behavior" />
            <LockedRow label="Google Analytics" />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button
              variant="ghost"
              disabled={save.isPending}
              onClick={() =>
                save.mutate(payload(), {
                  onSuccess: () => toast.success("Progress saved"),
                })
              }
            >
              Save progress
            </Button>
            <Button
              className="rounded-full"
              disabled={!canFinish || save.isPending}
              onClick={() =>
                save.mutate(
                  { ...payload(), status: "in_use" },
                  {
                    onSuccess: () => {
                      toast.success("Message saved");
                      navigate({ to: "/automation" });
                    },
                  },
                )
              }
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Save and finish
            </Button>
          </div>
          {!canFinish && (
            <p className="mt-2 text-right text-xs text-muted-foreground">
              Add a sender address, a subject line and a design to finish.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function LockedRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 opacity-50">
      <Switch disabled />
      <span className="text-sm">{label}</span>
      <Lock className="h-3.5 w-3.5" />
    </div>
  );
}
