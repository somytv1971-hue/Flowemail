import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAutoresponder,
  updateAutoresponder,
  ensureAutoresponderMessage,
} from "@/lib/autoresponders.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactListNameSelect } from "@/components/contact-list-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Paperclip,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/autoresponder/$id")({
  head: () => ({
    meta: [
      { title: "Edit autoresponder — Flowmail" },
      { name: "description", content: "Configure your autoresponder schedule, sender and content." },
      { property: "og:title", content: "Edit autoresponder — Flowmail" },
      {
        property: "og:description",
        content: "Configure your autoresponder schedule, sender and content.",
      },
    ],
  }),
  component: AutoresponderEditor,
});

const DAYS = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
  { id: "sun", label: "Sunday" },
];

function AutoresponderEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getAutoresponder);
  const update = useServerFn(updateAutoresponder);

  const { data: row, isLoading } = useQuery({
    queryKey: ["autoresponder", id],
    queryFn: () => get({ data: { id } }),
  });

  const [form, setForm] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (row && !form) setForm(row);
  }, [row, form]);

  const save = useMutation({
    mutationFn: (patch: any) => update({ data: { id, ...patch } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["autoresponder", id] });
      qc.invalidateQueries({ queryKey: ["autoresponders"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save"),
  });

  if (isLoading || !form) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const days: string[] = form.days_of_week ?? [];

  const toggleDay = (d: string) =>
    set("days_of_week", days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);

  const payload = () => ({
    name: form.name,
    list_name: form.list_name,
    cycle_day: Number(form.cycle_day) || 0,
    send_mode: form.send_mode,
    send_time: form.send_time,
    days_of_week: days,
    from_email: form.from_email,
    reply_to: form.reply_to,
    subject: form.subject,
    track_opens: form.track_opens,
    track_clicks: form.track_clicks,
  });

  const openDesign = {
    isPending: designing,
    mutate: async () => {
      setDesigning(true);
      try {
        await update({ data: { id, ...payload() } });
        const res = await ensureMessage({ data: { id } });
        navigate({
          to: "/automation/messages/$id/design",
          params: { id: res.message_id },
        });
      } catch (e: any) {
        toast.error(e?.message ?? "Could not open the message designer");
      } finally {
        setDesigning(false);
      }
    },
  };

  const canFinish = form.subject?.trim() && form.from_email?.trim();


  return (
    <div className="mx-auto max-w-3xl pb-12">
      <Link
        to="/autoresponder"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Autoresponders
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
              <h1 className="font-display text-2xl font-semibold text-primary">{form.name}</h1>
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
            Only you will see this name. It appears on the list of your autoresponders.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Linked list</span>
            <ContactListNameSelect
              value={form.list_name}
              onChange={(name: string) => set("list_name", name)}
              className="h-8 w-56"
            />
          </div>
        </div>

        {/* Settings */}
        <div className="flex gap-6 p-8">
          <span className="mt-2 h-3 w-3 shrink-0 rounded-full bg-success" />
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold">Autoresponder settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When do you want this message to go out?
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm">Delay</span>
              <Input
                type="number"
                min={0}
                value={form.cycle_day}
                onChange={(e) => set("cycle_day", e.target.value)}
                className="h-9 w-20"
              />
              <span className="text-sm text-muted-foreground">days</span>
              <Select value={form.send_mode} onValueChange={(v) => set("send_mode", v)}>
                <SelectTrigger className="h-9 w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="signup_time">Same time as signup time</SelectItem>
                  <SelectItem value="immediately">Send immediately</SelectItem>
                  <SelectItem value="exact_time">At an exact time</SelectItem>
                </SelectContent>
              </Select>
              {form.send_mode === "exact_time" && (
                <Input
                  type="time"
                  value={form.send_time}
                  onChange={(e) => set("send_time", e.target.value)}
                  className="h-9 w-32"
                />
              )}
            </div>

            <div className="mt-5">
              <div className="text-sm text-muted-foreground">
                Allow the message to be sent on
              </div>
              <div className="mt-2 flex flex-wrap gap-4">
                {DAYS.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={days.includes(d.id)}
                      onCheckedChange={() => toggleDay(d.id)}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* From / reply-to */}
        <div className="flex gap-6 p-8">
          <span className="mt-2 h-3 w-3 shrink-0 rounded-full bg-success" />
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
            <Link
              to="/emails-and-domains"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              Add another address
            </Link>

            <div className="mt-4 flex gap-3 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p>
                Use an email address at a custom domain and authenticate it with DKIM so your
                "From" address meets inbox provider requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="p-8">
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
            {(form.subject ?? "").length}/150 characters. Keep it under 60 for mobile.
          </p>
        </div>

        {/* Design and content */}
        <div className="p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-xl font-semibold">Design and content</h2>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={openDesign.isPending}
              onClick={() => openDesign.mutate()}
            >
              {openDesign.isPending ? "Opening…" : "Design message"}
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
                save.mutate(payload(), { onSuccess: () => toast.success("Progress saved") })
              }
            >
              Save
            </Button>
            <Button
              className="rounded-full"
              disabled={!canFinish || save.isPending}
              onClick={() =>
                save.mutate(
                  { ...payload(), status: "on" },
                  {
                    onSuccess: () => {
                      toast.success("Autoresponder published");
                      navigate({ to: "/autoresponder" });
                    },
                  },
                )
              }
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Save and publish
            </Button>
          </div>
          {!canFinish && (
            <p className="mt-2 text-right text-xs text-muted-foreground">
              Add a sender address and a subject line to publish.
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
