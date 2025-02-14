import Dexie, { Table } from "dexie";

export interface Message {
  id?: number;
  content: string;
  role: string;
  timestamp: Date;
}

export class ChatDatabase extends Dexie {
  constructor() {
    super("ChatDatabase");
  }

  // Method to get or create a table for a specific chat
  getTable(uuid: string): Table<Message> {
    if (!this.tables.find((table) => table.name === uuid)) {
      this.version(this.verno + 1).stores({
        [uuid]: "++id, timestamp", // Create a new table for the chat
      });
      this.table(uuid); // Register the table
    }
    return this.table(uuid);
  }
}

export const db = new ChatDatabase();
