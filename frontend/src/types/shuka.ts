// Shapes of the data the backend sends. They match backend/main.py.

export type RiskLevel = "low" | "medium" | "high";

export interface DailyRain {
  date: string; // YYYY-MM-DD
  mm: number;
}

// One state on the map (from /states)
export interface StateSummary {
  id: string;
  name: string;
  lat: number;
  lon: number;
  riskLevel: RiskLevel;
  falseOnsetRate: number;
  falseOnsetYears: number;
  yearsAnalysed: number;
  seasonalRainMean: number;
  seasonLengthMedian: number;
  safePlantingFrom: string;
  farmerCount: number;
  typicalPractice: string; // rotation id, a starting guess for what farmers grow here
}

// One year's season (inside the profile)
export interface Season {
  year: number;
  false_onset: boolean;
  no_season_detected?: boolean;
  real_onset?: string;
  seasonal_rain: number;
}

// Full climate profile of one state (from /states/{id})
export interface StateProfile extends StateSummary {
  excludedYears: number[];
  firstYear: number;
  lastYear: number;
  falseOnsetYearList: number[];
  safePlantingBy: string;
  typicalSeasonEnd: string;
  seasonLengthDryYear: number;
  seasonalRainDryYear: number;
  rainVariabilityPct: number;
  heatDaysMean: number;
  longestDrySpellMedian: number;
  soilWetnessMean: number;
  trend: {
    splitYear: number;
    rainChangePct: number;
    falseOnsetRateEarly: number;
    falseOnsetRateLate: number;
    heatDaysEarly: number;
    heatDaysLate: number;
  };
  seasons: Season[];
  latestSeasonRain: DailyRain[];
}

export interface Scores {
  water: number;
  climate: number;
  soil: number;
  income: number;
}

// One rotation option in a recommendation
export interface RotationOption {
  id: string;
  name: string;
  seasons: string[][]; // [["Sorghum", "Cowpea (beans)"], ["Groundnut"]]
  isCurrent: boolean;
  scores: Scores;
  overall: number;
  why: string;
  evidence: string[];
  benefits: string[];
  risks: string[];
  gaps: string[];
  checkLocally: string;
}

// Answer from /recommend
export interface Recommendation {
  state: { id: string; name: string };
  priority: { id: string; label: string };
  options: RotationOption[];
  recommendedId: string;
  planting: {
    riskLevel: RiskLevel;
    safePlantingFrom: string;
    safePlantingBy: string;
    advice: string;
  };
  disclaimer: string;
}

// Choices for the planner form (from /options)
export interface PlannerOptions {
  currentRotations: { id: string; name: string }[];
  priorities: { id: string; label: string }[];
  languages: string[];
  demoMode: boolean;
}

// A signed-in extension officer
export interface Officer {
  id: number;
  username: string;
  name: string;
  stateId: string | null;
  role: "officer" | "admin";
}

export interface Session {
  token: string;
  officer: Officer;
}

export interface Farmer {
  id: number;
  name: string;
  phone: string;
  stateId: string;
  lga: string | null;
  language: string;
  crops: string | null;
  createdAt: string;
}

export interface NewFarmer {
  name: string;
  phone: string;
  lga?: string;
  language: string;
  crops?: string;
  consent: boolean;
}

export interface ImportResult {
  added: number;
  skipped: number;
  errors: { line: number; reason: string }[];
}

export interface DataStatus {
  lastSyncedAt: string | null;
  latestDataDay: string | null;
  totalDays: number;
}

// AI-written briefing that a future call agent will use as context
export interface BriefingContent {
  officerSummary: string;
  keyMessage: string;
  plantingAdvice: string;
  recommendationExplained: string;
  alternatives: { name: string; whenToChoose: string }[];
  warnings: string[];
  faq: { question: string; answer: string }[];
}

export interface Briefing {
  id: number;
  stateId: string;
  current: string;
  priority: string;
  language: string;
  status: "draft" | "approved" | "archived";
  source: "ai" | "template";
  content: BriefingContent;
  unverifiedNumbers: string[];
  riskyTopics: string[];
  handOverTopics: string[];
  createdAt: string;
  createdBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  needsReview: boolean;
}
