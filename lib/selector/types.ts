export type SelectorType = "css" | "xpath";
export type SpecificityMode = "strict" | "flexible";
export interface GenerationOptions {
  type: SelectorType | "both";
  mode: SpecificityMode;
  specificityLevel: number;
  preferredAttributes?: string[];
  excludePatterns?: RegExp[];
  maxCandidates?: number;
}
export interface CandidateSelector {
  selector: string;
  type: SelectorType;
  score: number;
  metrics: {
    uniqueness: number;
    stability: number;
    performance: number;
    matchCount: number;
    latencyMs?: number;
  };
  source: "heuristic" | "ai" | "override";
}
export interface ValidationResult {
  selector: CandidateSelector;
  valid: boolean;
  matched: number;
  error?: string;
}
export interface GenerationInput {
  html: string;
  description?: string;
}
