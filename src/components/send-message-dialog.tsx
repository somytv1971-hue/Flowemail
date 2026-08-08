import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactListSelect, useContactLists } from "@/components/contact-list-select";
import { sendMessageToList, sendTestMessage } from "@/lib/sending.functions";

/** Sends a saved automation message to a whole list, or to one test address. */
export function SendMessageDialog({
  messageId,
  disabled,
  label = "Send now",
}: {
  messageId: string;
  disabled?: boolean;
  label?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [listId, setListId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const { lists } = useContactLists();

  const sendList = useServerFn(sendMessageToList);
  const sendTest = useServerFn(sendTestMessage);

  const broadcast = useMutation({
    mutationFn: () => sendList({ data: { message_id: messageId, list_id: listId! } }),
    onSuccess: (res: any) => {
      toast.success(`Sent to ${res.sent} of ${res.total} contacts`);
      qc.invalidateQueries({ queryKey: ["report-summary"] });
      qc.invalidateQueries({ queryKey: ["automation-messages"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const test = useMutation({
    mutationFn: () => sendTest({ data: { message_id: messageId, email: testEmail.trim() } }),
    onSuccess: () => toast.success("Test email sent"),
    onError: (e: Error) => toast.error(e.message),
  });

  const selected = lists.find((l) => l.id === listId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full" disabled={disabled}>
          <Send className="mr-2 h-4 w-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send this message</DialogTitle>
          <DialogDescription>
            Emails go out from your confirmed sender address, with open and click tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Contact list</Label>
            <ContactListSelect value={listId} onChange={(id) => setListId(id)} />
            {selected ? (
              <p className="text-xs text-muted-foreground">
                {selected.contact_count ?? 0} contact(s) will receive this message.
              </p>
            ) : null}
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Or send a test to one address</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={!testEmail.includes("@") || test.isPending}
                onClick={() => test.mutate()}
              >
                {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send test"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!listId || broadcast.isPending} onClick={() => broadcast.mutate()}>
            {broadcast.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              "Send to list"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
