import { APIType } from "./ModelManager";

export interface ModelConfig {
  id: string;
  name: string;
  provider: APIType;
  contextWindow?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  maxTokens?: number;
  defaultTemperature?: number;
}