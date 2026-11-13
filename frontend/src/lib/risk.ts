import type { RiskLevel } from "@/types/location";

// One place for risk colours and labels, shared by the map, legend and panel
export const RISK_STYLES: Record<
  RiskLevel,
  { color: string; label: string; text: string; bg: string; border: string }
> = {
  high: {
    color: "#dc2626",
    label: "High risk",
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  medium: {
    color: "#d97706",
    label: "Medium risk",
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  low: {
    color: "#16a34a",
    label: "Low risk",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
};