import { db, Model } from './Dexie';
import { APIType } from './ModelManager';

export async function getModelById(modelId: number): Promise<Model | undefined> {
  return await db.models.get(modelId);
}

export async function getAllModels(): Promise<Model[]> {
  return await db.models.orderBy('timestamp').reverse().toArray();
}

export async function addModel(model: Omit<Model, 'id' | 'timestamp'>): Promise<number> {
  return await db.models.add({
    ...model,
    timestamp: new Date(),
  });
}

export async function updateModel(id: number, model: Partial<Model>): Promise<number> {
  await db.models.update(id, {
    ...model,
    timestamp: new Date(),
  });
  return id;
}

export async function deleteModel(id: number): Promise<void> {
  await db.models.delete(id);
}

export function getAPITypeFromString(provider: string): APIType {
  return APIType[provider as keyof typeof APIType];
}

export function getProviderFromAPIType(type: APIType): string {
  return APIType[type];
} 