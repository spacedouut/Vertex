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

export const models: ModelConfig[] = [
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "Deepseek R1 Distill 70B",
    provider: APIType.OpenAI,
    contextWindow: 32768,
    defaultTemperature: 0.7,
  },
  {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus",
    provider: APIType.Anthropic,
    contextWindow: 200000,
    defaultTemperature: 0.7,
  },
  {
    id: "anthropic/claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: APIType.Anthropic,
    contextWindow: 200000,
    defaultTemperature: 0.7,
  },
  {
    id: "mistral/mistral-large",
    name: "Mistral Large",
    provider: APIType.Mistral,
    contextWindow: 32768,
    defaultTemperature: 0.7,
  },
  {
    id: "google/gemini-pro",
    name: "Gemini Pro",
    provider: APIType.Google,
    contextWindow: 32768,
    defaultTemperature: 0.7,
  },
]; 