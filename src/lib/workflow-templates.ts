export type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  level: "basic" | "advanced" | "pro";
  channel: "email" | "web";
  start_element: string;
};

export const TEMPLATE_CATEGORIES = [
  "All templates",
  "Welcome",
  "Engagement",
  "Sales & Ecommerce",
  "Lead qualification",
  "Post-purchase",
  "Affiliate marketing",
  "Abandoned cart",
  "Re-engagement",
] as const;

export const TEMPLATES: Template[] = [
  { id: "welcome-new", name: "Welcome new subscribers", description: "Greet new contacts and introduce your brand right after they subscribe.", category: "Welcome", level: "basic", channel: "email", start_element: "subscribes" },
  { id: "welcome-goal", name: "Welcome + goal message", description: "Send a welcome, then a follow-up when contacts reach a goal.", category: "Welcome", level: "basic", channel: "email", start_element: "subscribes" },
  { id: "internal-popup", name: "Internal launch popup", description: "Show a popup to visitors when a new product launches.", category: "Engagement", level: "basic", channel: "web", start_element: "clicks_link" },
  { id: "reward-loyal", name: "Reward the loyal ones", description: "Reward contacts who consistently open and click your messages.", category: "Engagement", level: "advanced", channel: "email", start_element: "opens_message" },
  { id: "first-time-buyer", name: "First-time buyer bonus", description: "Send a thank-you and bonus after a customer's first purchase.", category: "Sales & Ecommerce", level: "advanced", channel: "email", start_element: "is_sent_message" },
  { id: "winners", name: "Winners", description: "Celebrate top spenders with an exclusive VIP message.", category: "Sales & Ecommerce", level: "advanced", channel: "email", start_element: "is_sent_message" },
  { id: "discount-mega-tag", name: "Discount for a mega-tag audience", description: "Send a discount to your most engaged tag segment.", category: "Engagement", level: "advanced", channel: "email", start_element: "clicks_link" },
  { id: "birthday-message", name: "Birthday message", description: "Wish contacts a happy birthday and offer a small gift.", category: "Engagement", level: "basic", channel: "email", start_element: "special_occasion" },
  { id: "contact-only-tag", name: "Contact only by tag", description: "Route messages based on the tags assigned to contacts.", category: "Engagement", level: "basic", channel: "email", start_element: "subscribes" },
  { id: "customer-onboarding", name: "Customer onboarding", description: "Guide new customers through your product step by step.", category: "Welcome", level: "basic", channel: "email", start_element: "subscribes" },
  { id: "webinar-promotion", name: "Webinar promotion", description: "Invite contacts to sign up and remind them before the event.", category: "Engagement", level: "advanced", channel: "email", start_element: "is_sent_message" },
  { id: "post-webinar-followup", name: "Post-webinar follow-up", description: "Send tailored follow-ups based on webinar attendance.", category: "Engagement", level: "advanced", channel: "email", start_element: "is_sent_message" },
  { id: "delivery-message", name: "Delivery message", description: "Notify customers when their order is on the way.", category: "Post-purchase", level: "advanced", channel: "email", start_element: "is_sent_message" },
  { id: "back-to-shopping", name: "Back to shopping", description: "Bring shoppers back with recommendations after a visit.", category: "Re-engagement", level: "advanced", channel: "web", start_element: "clicks_link" },
  { id: "converting-contacts", name: "Converting contacts to customers", description: "Move engaged contacts down the funnel to first purchase.", category: "Lead qualification", level: "advanced", channel: "email", start_element: "clicks_link" },
  { id: "early-bird-sale", name: "Early bird sale", description: "Reward your fastest buyers with early access pricing.", category: "Sales & Ecommerce", level: "basic", channel: "email", start_element: "is_sent_message" },
  { id: "welcome-new-customers", name: "Welcome new customers", description: "Send a thank-you and next steps after the first sale.", category: "Post-purchase", level: "basic", channel: "email", start_element: "is_sent_message" },
  { id: "recovering-lost-customers", name: "Recovering lost customers", description: "Win back inactive customers with a targeted offer.", category: "Re-engagement", level: "advanced", channel: "email", start_element: "is_sent_message" },
  { id: "back-cart-plus", name: "Back to cart plus", description: "Follow up on abandoned carts with escalating incentives.", category: "Abandoned cart", level: "advanced", channel: "email", start_element: "is_sent_message" },
  { id: "welcome-new-visuals", name: "Welcome new visuals", description: "Introduce visitors to your latest visual content.", category: "Welcome", level: "basic", channel: "web", start_element: "clicks_link" },
  { id: "post-abandonment", name: "Post-cart abandonment", description: "Recover sales after a visitor abandons the checkout.", category: "Abandoned cart", level: "advanced", channel: "email", start_element: "is_sent_message" },
  { id: "post-purchase-followup", name: "Post-purchase follow-up", description: "Ask for reviews and suggest related products.", category: "Post-purchase", level: "basic", channel: "email", start_element: "is_sent_message" },
  { id: "post-purchase-upsell", name: "Post-purchase upsell", description: "Recommend upgrades right after a completed purchase.", category: "Post-purchase", level: "advanced", channel: "email", start_element: "is_sent_message" },
  { id: "upselling", name: "Upselling", description: "Suggest higher-tier products to interested contacts.", category: "Sales & Ecommerce", level: "advanced", channel: "email", start_element: "clicks_link" },
  { id: "affiliate-launch", name: "Affiliate product launch", description: "Coordinate an affiliate campaign around a new launch.", category: "Affiliate marketing", level: "pro", channel: "email", start_element: "is_sent_message" },
  { id: "affiliate-invitation", name: "Affiliate invitation", description: "Invite selected contacts to join your affiliate program.", category: "Affiliate marketing", level: "pro", channel: "email", start_element: "clicks_link" },
  { id: "affiliate-onboarding", name: "Affiliate onboarding", description: "Onboard new affiliates with training and assets.", category: "Affiliate marketing", level: "pro", channel: "email", start_element: "subscribes" },
  { id: "affiliate-reactivation", name: "Affiliate reactivation", description: "Re-engage inactive affiliates with fresh incentives.", category: "Affiliate marketing", level: "pro", channel: "email", start_element: "is_sent_message" },
  { id: "affiliate-welcome", name: "Affiliate welcome message", description: "Send a warm welcome to new affiliate partners.", category: "Affiliate marketing", level: "pro", channel: "email", start_element: "subscribes" },
  { id: "affiliate-tagging", name: "Tagging affiliate contacts", description: "Automatically tag contacts sent by your affiliates.", category: "Affiliate marketing", level: "pro", channel: "email", start_element: "subscribes" },
  { id: "affiliate-scoring", name: "Scoring affiliate contacts", description: "Score contacts based on affiliate-driven engagement.", category: "Affiliate marketing", level: "pro", channel: "email", start_element: "clicks_link" },
  { id: "recommend-products", name: "Recommend top products", description: "Suggest best-sellers to browsing contacts.", category: "Sales & Ecommerce", level: "basic", channel: "email", start_element: "clicks_link" },
  { id: "top-cart-buyers", name: "Top cart buyers", description: "Reward customers with the highest cart values.", category: "Sales & Ecommerce", level: "basic", channel: "email", start_element: "is_sent_message" },
  { id: "thanksgiving", name: "Thanksgiving", description: "Send a seasonal thank-you to your community.", category: "Engagement", level: "basic", channel: "email", start_element: "is_sent_message" },
  { id: "leads-from-form", name: "Leads from your form", description: "Nurture leads captured through your signup forms.", category: "Lead qualification", level: "basic", channel: "email", start_element: "subscribes" },
  { id: "abandonment-followup", name: "Abandonment follow-up", description: "Bring back visitors who dropped off mid-flow.", category: "Abandoned cart", level: "advanced", channel: "web", start_element: "clicks_link" },
  { id: "content-based-nurture", name: "Content-based nurture", description: "Send content tailored to what each contact reads.", category: "Engagement", level: "advanced", channel: "email", start_element: "clicks_link" },
  { id: "cross-channel", name: "Cross-channel welcome", description: "Combine email and web touchpoints for new contacts.", category: "Welcome", level: "advanced", channel: "email", start_element: "subscribes" },
  { id: "simple-content", name: "Simple content nurture", description: "A lightweight nurture sequence for new leads.", category: "Lead qualification", level: "basic", channel: "email", start_element: "subscribes" },
  { id: "advanced-nurture", name: "Advanced nurture path", description: "Branching nurture based on engagement signals.", category: "Lead qualification", level: "advanced", channel: "email", start_element: "opens_message" },
];
