import Dexie, { Table } from "dexie";

export interface Message {
  id?: number;
  chatId: number; // Foreign key referencing the chat
  content: string;
  role: string;
  timestamp: Date;
}

export interface Chat {
  id?: number;
  uuid: string;
  name?: string; 
  modelId?: number; // Changed from model string to modelId number reference
  temperature?: number;
  userId?: string; 
  timestamp?: Date;
}

export interface Model {
  id?: number;
  name: string;
  modelId: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  contextWindow?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  maxTokens?: number;
  defaultTemperature?: number;
  timestamp?: Date;
}

export class ChatDatabase extends Dexie {
  chats!: Table<Chat>;
  messages!: Table<Message>;
  models!: Table<Model>;

  constructor() {
    super("ChatDatabase");
    this.version(4).stores({
      chats: "++id, uuid, timestamp",
      messages: "++id, chatId, timestamp",
      models: "++id, modelId, provider, timestamp",
    });
  }
}

export const db = new ChatDatabase();