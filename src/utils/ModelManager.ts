import { generateText, streamText } from "ai";

// Providers
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createMistral } from "@ai-sdk/mistral";
import { createCohere } from "@ai-sdk/cohere";
import { createTogetherAI } from "@ai-sdk/togetherai";

export enum APIType {
  OpenAI,
  Anthropic,
  Google,
  DeepSeek,
  Mistral,
  Cohere,
  TogetherAI,
}

interface APIInfo {
  provider: APIType;
  key: string;
  endpoint?: string;
}

export class ModelManager {
  public apiInfo: APIInfo;
  constructor(
    apiInfo: APIInfo = {
      provider: APIType.OpenAI,
      key: "",
    }
  ) {
    this.apiInfo = apiInfo;
  }

  getModelInstance(model: string) {
    const apiKey = this.apiInfo.key;
    const baseURL = this.apiInfo.endpoint;

    switch (this.apiInfo.provider) {
      case APIType.OpenAI:
        const openai = createOpenAI({
          apiKey: apiKey,
          ...(baseURL && { baseURL }),
        });
        return openai(model);
      case APIType.Anthropic:
        const anthropic = createAnthropic({
          apiKey: apiKey,
          ...(baseURL && { baseURL }),
        });
        return anthropic(model);
      case APIType.Google:
        const google = createGoogleGenerativeAI({
          apiKey: apiKey,
          ...(baseURL && { baseURL }),
        });
        return google(model);
      case APIType.DeepSeek:
        const deepseek = createDeepSeek({
          apiKey: apiKey,
          ...(baseURL && { baseURL }),
        });
        return deepseek(model);
      case APIType.Mistral:
        const mistral = createMistral({
          apiKey: apiKey,
          ...(baseURL && { baseURL }),
        });
        return mistral(model);
      case APIType.Cohere:
        const cohere = createCohere({
          apiKey: apiKey,
          ...(baseURL && { baseURL }),
        });
        return cohere(model);
      case APIType.TogetherAI:
        const togetherai = createTogetherAI({
          apiKey: apiKey,
          ...(baseURL && { baseURL }),
        });
        return togetherai(model);
      default:
        throw new Error("Invalid API provider");
    }
  }

  async stream(messages: any[], model: string, options?: any) {
    const streamParameters = {
      model: this.getModelInstance(model),
      messages,
      ...options,
    };

    const { textStream } = streamText(streamParameters)
  
    return textStream;
  }

  async generate(messages: any[], model: string, options?: any) {
    const streamParameters = {
      model: this.getModelInstance(model),
      messages,
      ...options,
    };

    return generateText(streamParameters);
  }
}
