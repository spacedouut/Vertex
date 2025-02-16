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
  model?: string;
  temperature?: number;
  userId?: string; 
  timestamp?: Date;
}

export class ChatDatabase extends Dexie {
  chats!: Table<Chat>;
  messages!: Table<Message>;

  constructor() {
    super("ChatDatabase");
    this.version(2).stores({
      chats: "++id, uuid, timestamp",
      messages: "++id, chatId, timestamp", 
    });
  }
}

export const db = new ChatDatabase();