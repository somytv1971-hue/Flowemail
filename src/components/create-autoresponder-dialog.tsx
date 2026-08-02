import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, MousePointerSquareDashed, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function CreateAutoresponderDialog({
  open,
  onOpenChange,
  onSelfBuild,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelfBuild: () => void;
  pending?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-2xl">
            How do you want to create your autoresponder?
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-5 py-4 sm:grid-cols-2">
          <div className="flex flex-col">
            <button
              disabled={pending}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={onSelfBuild}
              className={`rounded-2xl border-2 bg-muted/30 p-6 text-center transition-all disabled:opacity-60 ${
                hover ? "border-primary" : "border-border"
              }`}
            >
              <div className="font-display text-lg font-semibold">By myself</div>
              <div className="mx-auto mt-5 grid h-24 w-32 place-items-center rounded-xl bg-primary/10 text-primary">
                <MousePointerSquareDashed className="h-10 w-10" />
              </div>
            </button>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Build from scratch or customise a template in a drag-and-drop editor
            </p>
          </div>

          <div className="flex flex-col">
            <div className="relative rounded-2xl border-2 border-border bg-muted/50 p-6 text-center opacity-90">
              <div className="font-display text-lg font-semibold text-muted-foreground">
                With AI
              </div>
              <div className="mx-auto mt-5 grid h-24 w-32 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Sparkles className="h-10 w-10" />
              </div>
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-warning text-warning-foreground shadow-lg">
                  <Lock className="h-7 w-7" />
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              <button
                className="font-medium text-primary hover:underline"
                onClick={() => toast.info("Upgrade your plan to unlock AI autoresponders.")}
              >
                Upgrade
              </button>{" "}
              to get fresh and engaging email ideas fast.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
