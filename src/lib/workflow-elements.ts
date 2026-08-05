import {
  UserPlus,
  Link2,
  MailOpen,
  Gift,
  PencilRuler,
  Send,
  Copy,
  ArrowRightLeft,
  ShieldCheck,
  Globe,
  Star,
  Tag,
  ShoppingCart,
  Timer,
  Filter,
  MessageSquare,
  GitBranch,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ElementItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export type ElementGroup = {
  label: string;
  items: ElementItem[];
};

export type ElementSection = {
  key: "conditions" | "actions" | "filters";
  label: string;
  groups: ElementGroup[];
};

export const START_ELEMENTS: ElementItem[] = [
  { id: "subscribes", label: "Subscribes", icon: UserPlus },
  { id: "clicks_link", label: "Clicks a link", icon: Link2 },
  { id: "opens_message", label: "Opens a message", icon: MailOpen },
  { id: "special_occasion", label: "Has a special occasion", icon: Gift },
  { id: "updates_custom_field", label: "Updates a custom field", icon: PencilRuler },
  { id: "is_sent_message", label: "Is sent a message", icon: Send },
  { id: "copied_to_list", label: "Is copied to a list", icon: Copy },
  { id: "moved_to_list", label: "Is moved to a list", icon: ArrowRightLeft },
  { id: "updates_consent", label: "Updates consent status", icon: ShieldCheck },
];

export const ELEMENT_SECTIONS: ElementSection[] = [
  {
    key: "conditions",
    label: "Conditions",
    groups: [
      {
        label: "Basic",
        items: [
          { id: "c_subscribed_via", label: "Subscribed via...", icon: UserPlus },
          { id: "c_link_clicked", label: "Link clicked?", icon: Link2 },
          { id: "c_message_opened", label: "Message opened?", icon: MailOpen },
          { id: "c_special_occasion", label: "Special occasion", icon: Gift },
          { id: "c_custom_field", label: "Custom field changed", icon: PencilRuler },
          { id: "c_message_sent", label: "Message sent", icon: Send },
          { id: "c_copied_list", label: "Contact copied to list?", icon: Copy },
          { id: "c_moved_list", label: "Contact moved to list?", icon: ArrowRightLeft },
          { id: "c_consent_updated", label: "Consent status updated", icon: ShieldCheck },
          { id: "c_landing_visited", label: "Landing page visited", icon: Globe },
        ],
      },
      {
        label: "Tags and scoring",
        items: [
          { id: "c_score_given", label: "Score given", icon: Star },
          { id: "c_tag_assigned", label: "Tag assigned", icon: Tag },
        ],
      },
      {
        label: "Ecommerce",
        items: [
          { id: "c_purchase_made", label: "Purchase made", icon: ShoppingCart },
          { id: "c_cart_abandoned", label: "Cart abandoned", icon: ShoppingCart },
        ],
      },
    ],
  },
  {
    key: "actions",
    label: "Actions",
    groups: [
      {
        label: "Messaging",
        items: [
          { id: "a_send_message", label: "Send message", icon: Send },
          { id: "a_send_sms", label: "Send SMS", icon: MessageSquare },
        ],
      },
      {
        label: "Contact",
        items: [
          { id: "a_add_tag", label: "Add tag", icon: Tag },
          { id: "a_remove_tag", label: "Remove tag", icon: Tag },
          { id: "a_copy_list", label: "Copy to list", icon: Copy },
          { id: "a_move_list", label: "Move to list", icon: ArrowRightLeft },
          { id: "a_remove_contact", label: "Remove contact", icon: Trash2 },
          { id: "a_change_score", label: "Change score", icon: Star },
        ],
      },
      {
        label: "Flow",
        items: [
          { id: "a_wait", label: "Wait", icon: Timer },
          { id: "a_branch", label: "Branch", icon: GitBranch },
        ],
      },
    ],
  },
  {
    key: "filters",
    label: "Filters",
    groups: [
      {
        label: "Audience",
        items: [
          { id: "f_segment", label: "Segment", icon: Users },
          { id: "f_range", label: "Amount range", icon: Filter },
        ],
      },
    ],
  },
];

export function findStartElement(id: string | null | undefined): ElementItem | undefined {
  if (!id) return undefined;
  return START_ELEMENTS.find((e) => e.id === id);
}
