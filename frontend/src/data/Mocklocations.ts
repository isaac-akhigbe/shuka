// MOCK DATA ONLY. Replaced by the backend API on hackathon day.
// Same shape the FastAPI backend will return.

import type { DailyRain, LocationRisk, RiskLevel, Verdict } from "@/types/location";

const YEARS_ANALYSED = 26;

// [id, name, lat, lon, falseOnsetYears, farmersRegistered]
const STATES: [string, string, number, number, number, number][] = [
  ["kano", "Kano", 12.0, 8.52, 8, 142],
  ["kaduna", "Kaduna", 10.52, 7.44, 5, 118],
  ["katsina", "Katsina", 12.99, 7.6, 9, 97],
  ["sokoto", "Sokoto", 13.06, 5.24, 11, 76],
  ["zamfara", "Zamfara", 12.16, 6.66, 9, 64],
  ["kebbi", "Kebbi", 12.45, 4.2, 10, 71],
  ["jigawa", "Jigawa", 11.76, 9.34, 9, 88],
  ["bauchi", "Bauchi", 10.31, 9.84, 6, 93],
  ["gombe", "Gombe", 10.29, 11.17, 6, 52],
  ["yobe", "Yobe", 11.75, 11.96, 11, 48],
  ["borno", "Borno", 11.85, 13.16, 12, 39],
  ["adamawa", "Adamawa", 9.21, 12.48, 5, 61],
  ["taraba", "Taraba", 8.89, 11.36, 3, 44],
  ["plateau", "Plateau", 9.9, 8.86, 3, 57],
  ["nasarawa", "Nasarawa", 8.49, 8.52, 3, 49],
  ["benue", "Benue", 7.73, 8.54, 2, 83],
  ["kogi", "Kogi", 7.8, 6.74, 2, 46],
  ["kwara", "Kwara", 8.5, 4.55, 3, 42],
  ["niger", "Niger", 9.61, 6.56, 5, 104],
  ["fct", "FCT Abuja", 9.06, 7.49, 4, 35],
];

function riskLevelFor(percent: number): RiskLevel {
  if (percent >= 30) return "high";
  if (percent >= 15) return "medium";
  return "low";
}

// Simple seeded random so mock data is the same on every reload
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// High risk states get the classic false onset pattern
// (a burst of rain, then a long dry spell). Others get steadier rain.
function mockRain(id: string, level: RiskLevel): DailyRain[] {
  const rand = seeded(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const start = new Date("2026-05-01");
  const days: DailyRain[] = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    let mm = 0;

    if (level === "high") {
      if (i >= 8 && i <= 10) mm = 6 + rand() * 6; // onset burst
      else if (i > 10 && i < 26) mm = 0; // dry spell
      else mm = rand() < 0.2 ? rand() * 4 : 0;
    } else if (level === "medium") {
      mm = rand() < 0.35 ? rand() * 12 : 0;
    } else {
      mm = rand() < 0.55 ? 3 + rand() * 15 : 0;
    }

    days.push({ date: d.toISOString().slice(0, 10), mm: Math.round(mm * 10) / 10 });
  }
  return days;
}

const MESSAGES: Record<RiskLevel, { verdict: Verdict; message: string }> = {
  high: { verdict: "wait", message: "Dry spell likely in next 10 days. Do not plant yet." },
  medium: { verdict: "wait", message: "Rains unstable. Wait for confirmation before planting." },
  low: { verdict: "plant", message: "Rains established. Safe to plant." },
};

export const mockLocations: LocationRisk[] = STATES.map(
  ([id, name, lat, lon, falseOnsetYears, farmersRegistered]) => {
    const riskPercent = Math.round((falseOnsetYears / YEARS_ANALYSED) * 100);
    const riskLevel = riskLevelFor(riskPercent);
    return {
      id,
      name,
      lat,
      lon,
      riskPercent,
      falseOnsetYears,
      yearsAnalysed: YEARS_ANALYSED,
      riskLevel,
      verdict: MESSAGES[riskLevel].verdict,
      verdictMessage: MESSAGES[riskLevel].message,
      last30DaysRain: mockRain(id, riskLevel),
      farmersRegistered,
    };
  }
);