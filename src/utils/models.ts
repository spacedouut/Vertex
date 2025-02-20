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
    id: "qwen/qwen-vl-plus:free",
    name: "Qwen VL Plus",
    provider: APIType.OpenAI,
    contextWindow: 16384,
    defaultTemperature: 0.8,
  },
  {
    id: "google/learnlm-1.5-pro-experimental:free",
    name: "LearnLM 1.5 Pro",
    provider: APIType.OpenAI,
    contextWindow: 16384,
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