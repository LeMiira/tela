// Minimal storage implementation since we are using localStorage on the client
export interface IStorage {
  // Add methods if needed later
}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
