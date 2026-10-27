export const platforms = [
  { id: 'instagram', name: 'Instagram', symbol: '◎' },
  { id: 'threads', name: 'Threads', symbol: '@' },
  { id: 'facebook', name: 'Facebook', symbol: 'f' },
  { id: 'x', name: 'X', symbol: '𝕏' },
] as const;

export type PlatformId = typeof platforms[number]['id'];
export interface DraftPost {
  id: string;
  revision: number;
  brandId: string;
  status: 'draft';
  createdAt: string;
  updatedAt: string;
  theme: string;
  instructions: string;
  platforms: PlatformId[];
  bodies: Record<PlatformId, string>;
}

export function createDraft(brandId: string): DraftPost {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), revision: 0, brandId, status: 'draft', createdAt: now, updatedAt: now,
    theme: '', instructions: '', platforms: ['instagram'],
    bodies: { instagram: '', threads: '', facebook: '', x: '' },
  };
}

export function validateDraft(draft: DraftPost): string[] {
  const errors: string[] = [];
  if (!draft.theme.trim()) errors.push('投稿テーマを入力してください。');
  return errors;
}
