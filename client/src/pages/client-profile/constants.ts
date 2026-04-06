import { ClientStatus } from "@/types/api";
import { Activity, CircleOff, Handshake, Search } from "lucide-react";

export const STATUS_CONFIG: Record<ClientStatus, { label: string; icon: React.ElementType; badge: string; dot: string; ring: string }> = {
    active:      { label: "Active",      icon: Activity,  badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", ring: "ring-emerald-300" },
    inactive:    { label: "Inactive",    icon: CircleOff, badge: "bg-red-100 text-red-700 border border-red-200",             dot: "bg-red-500",     ring: "ring-red-300"     },
    prospecting: { label: "Prospecting", icon: Search,    badge: "bg-amber-100 text-amber-700 border border-amber-200",       dot: "bg-amber-500",   ring: "ring-amber-300"   },
    onboarding: { label: "Onboarding", icon: Handshake,    badge: "bg-violet-100 text-violet-700 border border-violet-200",       dot: "bg-violet-500",   ring: "ring-violet-300"   },
  };