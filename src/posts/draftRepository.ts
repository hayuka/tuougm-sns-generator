import { brands } from '../brands/brands';
import { platforms, validateDraft } from './draft';
import type { DraftPost } from './draft';

export interface DraftRepository {
  list(brandId: string): DraftPost[];
  get(brandId: string, postId: string): DraftPost | null;
  create(draft: DraftPost): DraftPost;
  update(draft: DraftPost, expectedRevision: number): DraftPost;
  delete(brandId: string, postId: string, expectedRevision: number): void;
}

export class DraftRepositoryError extends Error {
  code: 'invalid' | 'conflict' | 'missing';
  constructor(code: 'invalid' | 'conflict' | 'missing', message: string) { super(message); this.code = code; }
}
interface Envelope {
  version: 2;
  brandId: string;
  posts: DraftPost[];
  // Keep the exact migration source to detect later writes by a Phase 2 tab.
  legacySource: string | null;
}
const storageKey = (brandId: string) => `sns-generator:drafts:v2:${brandId}`;
const legacyKey = (brandId: string) => `sns-generator:draft:v1:${brandId}`;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isDate = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
const invalid = () => new DraftRepositoryError('invalid', '保存データの形式またはブランドが不正です。既存データは初期化していません。');
const conflict = () => new DraftRepositoryError('conflict', '別の画面で更新された可能性があります。上書きを停止しました。入力内容を控えてから、保存データを再読み込みしてください。');

export function isDraftPost(value: unknown, brandId: string): value is DraftPost {
  if (!isRecord(value) || !isRecord(value.bodies)) return false;
  const bodies = value.bodies;
  return typeof value.id === 'string' && value.id.trim().length > 0 && value.brandId === brandId &&
    Number.isSafeInteger(value.revision) && (value.revision as number) >= 1 &&
    value.status === 'draft' && isDate(value.createdAt) && isDate(value.updatedAt) &&
    typeof value.theme === 'string' && Boolean(value.theme.trim()) && typeof value.instructions === 'string' &&
    Array.isArray(value.platforms) && new Set(value.platforms).size === value.platforms.length &&
    value.platforms.every(id => platforms.some(platform => platform.id === id)) &&
    platforms.every(platform => typeof bodies[platform.id] === 'string');
}

export function createDraftRepository(getStorage: () => Storage): DraftRepository {
  function write(storage: Storage, envelope: Envelope) {
    const serialized = JSON.stringify(envelope);
    storage.setItem(storageKey(envelope.brandId), serialized);
    if (storage.getItem(storageKey(envelope.brandId)) !== serialized) throw conflict();
  }
  function read(brandId: string): Envelope {
    if (!brands.some(brand => brand.id === brandId)) throw invalid();
    const storage = getStorage();
    const raw = storage.getItem(storageKey(brandId));
    const legacy = storage.getItem(legacyKey(brandId));
    if (raw !== null) {
      const value: unknown = JSON.parse(raw);
      if (!isRecord(value) || value.version !== 2 || value.brandId !== brandId || !Array.isArray(value.posts) ||
        !value.posts.every(post => isDraftPost(post, brandId)) ||
        new Set(value.posts.map(post => post.id)).size !== value.posts.length ||
        !(value.legacySource === null || typeof value.legacySource === 'string')) throw invalid();
      if (value.legacySource !== legacy) throw conflict();
      return value as unknown as Envelope;
    }
    const envelope: Envelope = { version: 2, brandId, posts: [], legacySource: legacy };
    if (legacy === null) return envelope;
    const value: unknown = JSON.parse(legacy);
    if (!isRecord(value) || value.version !== 1 || !isRecord(value.draft) ||
      !Array.isArray(value.draft.platforms) || value.draft.platforms.length === 0) throw invalid();
    const draft = { ...value.draft, revision: 1 };
    if (!isDraftPost(draft, brandId)) throw invalid();
    envelope.posts = [draft];
    write(storage, envelope);
    return envelope;
  }
  function validInput(draft: DraftPost) {
    if (validateDraft(draft).length || !isDraftPost({ ...draft, revision: 1 }, draft.brandId)) throw invalid();
  }
  return {
    list(brandId) {
      return read(brandId).posts.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.id.localeCompare(b.id));
    },
    get(brandId, postId) { return read(brandId).posts.find(post => post.id === postId) ?? null; },
    create(draft) {
      validInput(draft);
      const envelope = read(draft.brandId);
      if (envelope.posts.some(post => post.id === draft.id)) throw conflict();
      const saved = { ...draft, revision: 1, updatedAt: new Date().toISOString() };
      write(getStorage(), { ...envelope, posts: [...envelope.posts, saved] });
      return saved;
    },
    update(draft, expectedRevision) {
      validInput(draft);
      const envelope = read(draft.brandId);
      const stored = envelope.posts.find(post => post.id === draft.id);
      if (!stored) throw new DraftRepositoryError('missing', '投稿は削除されたか、現在のブランドには存在しません。新規投稿としては保存しません。');
      if (stored.revision !== expectedRevision) throw conflict();
      const saved = { ...draft, createdAt: stored.createdAt, revision: stored.revision + 1, updatedAt: new Date().toISOString() };
      if (!isDraftPost(saved, draft.brandId)) throw invalid();
      write(getStorage(), { ...envelope, posts: envelope.posts.map(post => post.id === draft.id ? saved : post) });
      return saved;
    },
    delete(brandId, postId, expectedRevision) {
      const envelope = read(brandId);
      const stored = envelope.posts.find(post => post.id === postId);
      if (!stored) throw new DraftRepositoryError('missing', '投稿は既に削除されたか、現在のブランドには存在しません。');
      if (stored.revision !== expectedRevision) throw conflict();
      // Preserve the empty v2 envelope: the legacy draft must never be imported again.
      write(getStorage(), { ...envelope, posts: envelope.posts.filter(post => post.id !== postId) });
    },
  };
}
export const localDraftRepository = createDraftRepository(() => window.localStorage);
