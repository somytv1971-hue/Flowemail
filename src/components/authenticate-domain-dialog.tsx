import { useState } from "react";
import { Check, ChevronDown, Circle, Lightbulb, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const DKIM_PUBLIC_KEY =
  "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsDtodYYQum4xE3Lw2f" +
  "bLneVWtcNUd4cag1nWjLiNVbQQsyPTufC8NoUE86fTmKoREiHpAqokITHZDQR1mW2OW3A38f+v8kY1G6" +
  "ANViN0Gv4yc9h21HvJYQpywtrLnNo/q5kiYTyRGQjq2G89F5DsRTw6Rf/IVj/JqANKx2n1u9RzuNPb+m" +
  "OXy+UKw8ejLFN0syVgXgFhLdfpKtNAHH4AxrIksQoDcxVyA9w0c4YDs+vaDwtH8Goh74jOuTi4/EnK54" +
  "sMWe1heBcu8Y6pDezbkoqWWE9rxKOBSQReP4lmBvOQMd2o6QwU5xnzW386bjqGBhNIEotKobD81ObzNv" +
  "rMFQIDAQAB;";

export function dkimRecordsFor(domain: string) {
  const d = domain || "example.com";
  return {
    identifier: `default._domainkey.${d}`,
    key: DKIM_PUBLIC_KEY,
    dmarcHost: `_dmarc.${d}`,
    dmarc: `v=DMARC1; p=none; rua=mailto:postmaster@${d}`,
    spfHost: d,
    spf: "v=spf1 include:spf.maildns.net ~all",
  };
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex">
        <Input readOnly value={value} className="rounded-r-none" />
        <Button
          type="button"
          className="rounded-l-none"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
          }}
        >
          Copy
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  done,
  open,
  onToggle,
  children,
}: {
  title: string;
  done?: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 py-4 text-left"
      >
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <Circle className="h-5 w-5 text-primary" />
        )}
        <span className="flex-1 font-semibold">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="pb-6 pl-8 pr-2 text-sm">{children}</div>}
    </div>
  );
}

export function AuthenticateDomainDialog({
  open,
  onOpenChange,
  domain,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  domain: string;
}) {
  const [section, setSection] = useState<"dkim" | "dmarc" | "spf" | null>("dkim");
  const [strongKey, setStrongKey] = useState(false);
  const records = dkimRecordsFor(domain || "example.com");

  const toggle = (s: "dkim" | "dmarc" | "spf") => setSection((c) => (c === s ? null : s));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Authenticate</DialogTitle>
        </DialogHeader>
        <p className="pb-2 text-sm">
          <span className="font-semibold">Email domain:</span> {domain}
        </p>

        <Section
          title="Authenticate your domain with DKIM"
          open={section === "dkim"}
          onToggle={() => toggle("dkim")}
        >
          <ol className="space-y-1 text-muted-foreground">
            <li>1. In a separate tab or window, log into your domain account and find your domain's DNS records.</li>
            <li>2. Create a new TXT record.</li>
            <li>
              3. Paste the DKIM identifier into the Host or Name field. Then, paste the DKIM key
              into the TXT value field.
            </li>
          </ol>
          <div className="mt-4 space-y-4">
            <CopyField label="DKIM identifier" value={records.identifier} />
            <CopyField label="DKIM key" value={records.key} />

            <div className="flex items-center gap-3">
              <Switch checked={strongKey} onCheckedChange={setStrongKey} id="strong-dkim" />
              <Label htmlFor="strong-dkim" className="font-normal">
                Generate a 2048-bit DKIM key for stronger protection
              </Label>
            </div>
            <div className="flex gap-3 rounded-lg bg-muted/50 p-3 text-muted-foreground">
              <Lightbulb className="h-4 w-4 shrink-0" />
              <p>
                Providers use different names for the fields where you enter the DKIM identifier and
                DKIM key. The Name field can also be called Name, Host, Hostname, or Alias. The TXT
                value field can be called Data, Answer, or Destination.
              </p>
            </div>
            <p className="text-muted-foreground">4. Save your changes.</p>
            <p className="text-muted-foreground">
              Once the records are updated and correct, your domain will appear as{" "}
              <strong className="text-foreground">Authenticated.</strong> It may take about 48 hours
              for the changes to take effect.
            </p>
            <a href="#dkim" className="inline-block text-primary underline-offset-2 hover:underline">
              Learn more about DKIM authentication
            </a>
          </div>
        </Section>

        <Section
          title="DMARC record added"
          done
          open={section === "dmarc"}
          onToggle={() => toggle("dmarc")}
        >
          <p className="text-muted-foreground">
            A DMARC policy protects your domain from spoofing. This record is already in place.
          </p>
          <div className="mt-4 space-y-4">
            <CopyField label="DMARC host" value={`_dmarc.${domain}`} />
            <CopyField label="DMARC value" value={records.dmarc} />
          </div>
        </Section>

        <Section title="Add SPF record" open={section === "spf"} onToggle={() => toggle("spf")}>
          <p className="text-muted-foreground">
            Create a TXT record at your domain's root and paste the value below.
          </p>
          <div className="mt-4 space-y-4">
            <CopyField label="SPF host" value="@" />
            <CopyField label="SPF value" value={records.spf} />
          </div>
        </Section>

        <DialogFooter className="border-t pt-4">
          <Button onClick={() => onOpenChange(false)}>
            <Check className="mr-1 h-4 w-4" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
