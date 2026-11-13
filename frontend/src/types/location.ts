export type RiskLevel = "low" | "medium" | "high";
export type Verdict = "plant" | "wait";
 
export interface DailyRain {
  date: string; // YYYY-MM-DD
  mm: number;
}
 
export interface LocationRisk {
  id: string;
  name: string;
  lat: number;
  lon: number;
  riskPercent: number;
  falseOnsetYears: number;
  yearsAnalysed: number;
  riskLevel: RiskLevel;
  verdict: Verdict;
  verdictMessage: string;
  last30DaysRain: DailyRain[];
  farmersRegistered: number;
}