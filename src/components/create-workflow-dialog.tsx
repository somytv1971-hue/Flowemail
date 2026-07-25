import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Monitor } from "lucide-react";
import { toast } from "sonner";
import { createWorkflow } from "@/lib/workflows.functions";
import { START_ELEMENTS } from "@/lib/workflow-elements";

type Step = "name" | "channel" | "start";
type Channel = "email" | "web";

export function CreateWorkflowDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const navigate = useNavigate();
  const create = useServerFn(createWorkflow);
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [startEl, setStartEl] = useState<string | null>(null);

  const reset = () => {
    setStep("name");
    setName("");
    setChannel("email");
    setStartEl(null);
  };

  const m = useMutation({
    mutationFn: (payload: { name: string; channel: Channel; start_element: string }) =>
      create({ data: payload }),
    onSuccess: (row: any) => {
      toast.success("Workflow created");
      onCreated?.();
      onOpenChange(false);
      reset();
      navigate({ to: "/automation/workflows/$id", params: { id: row.id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        {step === "name" && (
          <>
            <DialogHeader>
              <DialogTitle>Name your workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Workflow name</Label>
              <Input
                autoFocus
                placeholder="e.g. Welcome new subscribers"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={!name.trim()} onClick={() => setStep("channel")}>
                Next: Choose a channel
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "channel" && (
          <>
            <DialogHeader>
              <DialogTitle>Step 1 of 2: Choose a channel</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-6">
              <ChannelCard
                icon={Mail}
                title="Email"
                desc="Create a journey for email subscribers"
                active={channel === "email"}
                onClick={() => setChannel("email")}
              />
              <ChannelCard
                icon={Monitor}
                title="Web"
                desc="Create a journey for subscribed and non-subscribed visitors"
                badge="New"
                active={channel === "web"}
                onClick={() => setChannel("web")}
              />
            </div>
            <DialogFooter className="justify-between sm:justify-between">
              <Button variant="ghost" onClick={() => setStep("name")}>
                Back
              </Button>
              <Button onClick={() => setStep("start")}>Next: Choose start element</Button>
            </DialogFooter>
          </>
        )}

        {step === "start" && (
          <>
            <DialogHeader>
              <DialogTitle>Step 2 of 2: Choose a start element</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Start the workflow when someone…</p>
            <div className="my-2 border-t pt-4">
              <div className="mb-3 text-center text-xs uppercase tracking-wide text-muted-foreground">
                Basic
              </div>
              <div className="grid grid-cols-3 gap-3">
                {START_ELEMENTS.map((el) => {
                  const Icon = el.icon;
                  const selected = startEl === el.id;
                  return (
                    <button
                      key={el.id}
                      onClick={() => setStartEl(el.id)}
                      className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left text-sm transition-all ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{el.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <DialogFooter className="justify-between sm:justify-between">
              <Button variant="ghost" onClick={() => setStep("channel")}>
                Back to Step 1
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!startEl || m.isPending}
                  onClick={() =>
                    startEl &&
                    m.mutate({ name: name.trim(), channel, start_element: startEl })
                  }
                >
                  {m.isPending ? "Creating…" : "Confirm"}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  desc,
  active,
  onClick,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl border-2 p-6 text-center transition-all ${
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          {badge}
        </span>
      )}
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="font-display text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </button>
  );
}
