export type MessageTemplate = {
  id: string;
  name: string;
  category: string;
  from: string;
  to: string;
  accent: string;
  layout: "hero" | "product" | "promo" | "text" | "grid";
};

export const MESSAGE_CATEGORIES = [
  "All templates",
  "Newsletter",
  "Promotion",
  "Welcome",
  "Ecommerce",
  "Event",
  "Holiday",
  "Announcement",
  "Re-engagement",
] as const;

const PALETTES: Array<[string, string]> = [
  ["oklch(0.72 0.16 25)", "oklch(0.86 0.09 60)"],
  ["oklch(0.55 0.19 265)", "oklch(0.78 0.13 200)"],
  ["oklch(0.62 0.17 145)", "oklch(0.87 0.1 120)"],
  ["oklch(0.5 0.15 300)", "oklch(0.8 0.12 330)"],
  ["oklch(0.3 0.05 260)", "oklch(0.65 0.14 240)"],
  ["oklch(0.75 0.15 80)", "oklch(0.9 0.08 100)"],
  ["oklch(0.6 0.2 20)", "oklch(0.85 0.11 40)"],
  ["oklch(0.45 0.12 200)", "oklch(0.75 0.13 170)"],
];

const LAYOUTS: MessageTemplate["layout"][] = ["hero", "product", "promo", "text", "grid"];

const SEED: Array<[string, string]> = [
  ["Monthly digest", "Newsletter"],
  ["Weekly roundup", "Newsletter"],
  ["Editor's picks", "Newsletter"],
  ["Behind the scenes", "Newsletter"],
  ["Product update", "Announcement"],
  ["Feature launch", "Announcement"],
  ["We're hiring", "Announcement"],
  ["New pricing", "Announcement"],
  ["Flash sale", "Promotion"],
  ["50% off weekend", "Promotion"],
  ["Free shipping", "Promotion"],
  ["Last chance", "Promotion"],
  ["Bundle deal", "Promotion"],
  ["Welcome aboard", "Welcome"],
  ["Getting started", "Welcome"],
  ["Confirm your email", "Welcome"],
  ["Your free trial", "Welcome"],
  ["Abandoned cart", "Ecommerce"],
  ["Order confirmation", "Ecommerce"],
  ["Shipping update", "Ecommerce"],
  ["Back in stock", "Ecommerce"],
  ["Rate your purchase", "Ecommerce"],
  ["New arrivals", "Ecommerce"],
  ["Webinar invite", "Event"],
  ["Conference pass", "Event"],
  ["Live stream today", "Event"],
  ["Save the date", "Event"],
  ["Event recap", "Event"],
  ["Black Friday", "Holiday"],
  ["Cyber Monday", "Holiday"],
  ["Merry Christmas", "Holiday"],
  ["Happy New Year", "Holiday"],
  ["Valentine's day", "Holiday"],
  ["Summer sale", "Holiday"],
  ["We miss you", "Re-engagement"],
  ["Come back offer", "Re-engagement"],
  ["Still interested?", "Re-engagement"],
  ["Your account expires", "Re-engagement"],
  ["Feedback survey", "Newsletter"],
  ["Referral program", "Promotion"],
];

export const MESSAGE_TEMPLATES: MessageTemplate[] = SEED.map(([name, category], i) => {
  const [from, to] = PALETTES[i % PALETTES.length];
  return {
    id: `tpl-${i + 1}`,
    name,
    category,
    from,
    to,
    accent: PALETTES[(i + 3) % PALETTES.length][0],
    layout: LAYOUTS[i % LAYOUTS.length],
  };
});
