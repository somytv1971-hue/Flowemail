import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type DomainAuthStatus = {
  domain: string;
  spf: boolean;
  dmarc: boolean;
  dkim: boolean;
};

async function txtRecords(name: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`,
      { headers: { accept: "application/dns-json" } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { Answer?: { data?: string }[] };
    return (json.Answer ?? []).map((a) => (a.data ?? "").replace(/"/g, "").trim());
  } catch {
    return [];
  }
}

export const checkDomainAuth = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ domain: z.string().min(3) }).parse(data))
  .handler(async ({ data }): Promise<DomainAuthStatus> => {
    const domain = data.domain.toLowerCase();
    const [root, dmarc, dkim] = await Promise.all([
      txtRecords(domain),
      txtRecords(`_dmarc.${domain}`),
      txtRecords(`default._domainkey.${domain}`),
    ]);

    return {
      domain,
      spf: root.some((r) => r.toLowerCase().startsWith("v=spf1")),
      dmarc: dmarc.some((r) => r.toLowerCase().startsWith("v=dmarc1")),
      dkim: dkim.some((r) => r.toLowerCase().includes("p=") && r.length > 20),
    };
  });
