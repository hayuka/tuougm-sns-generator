import { platforms } from './draft';
import type { DraftPost } from './draft';

// One current draft per brand. This boundary can be replaced with an API repository.
export interface DraftRepository {
  load(brandId: string): DraftPost | null;
  save(draft: DraftPost): void;
}
const storageKey = (brandId: string) => `sns-generator:draft:v1:${brandId}`;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isDate = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));

export function isDraftPost(value: unknown, brandId: string): value is DraftPost {
  if (!isRecord(value) || !isRecord(value.bodies)) return false;
  const bodies = value.bodies;
  return typeof value.id === 'string' && value.id.length > 0 && value.brandId === brandId &&
    value.status === 'draft' && isDate(value.createdAt) && isDate(value.updatedAt) &&
    typeof value.theme === 'string' && typeof value.instructions === 'string' &&
    Array.isArray(value.platforms) && value.platforms.length > 0 &&
    new Set(value.platforms).size === value.platforms.length &&
    value.platforms.every(id => platforms.some(platform => platform.id === id)) &&
    platforms.every(platform => typeof bodies[platform.id] === 'string');
}

export const localDraftRepository: DraftRepository = {
  load(brandId) {
    const raw = window.localStorage.getItem(storageKey(brandId));
    if (raw === null) return null;
    const envelope: unknown = JSON.parse(raw);
    if (!isRecord(envelope) || envelope.version !== 1 || !isDraftPost(envelope.draft, brandId)) {
      throw new Error('Invalid draft data');
    }
    return envelope.draft;
  },
  save(draft) {
    if (!isDraftPost(draft, draft.brandId)) throw new Error('Invalid draft data');
    window.localStorage.setItem(storageKey(draft.brandId), JSON.stringify({ version: 1, draft }));
  },
};
