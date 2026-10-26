export const platforms = [
  { id: 'instagram', name: 'Instagram', symbol: '◎' },
  { id: 'threads', name: 'Threads', symbol: '@' },
  { id: 'facebook', name: 'Facebook', symbol: 'f' },
  { id: 'x', name: 'X', symbol: '𝕏' },
] as const;

export type PlatformId = typeof platforms[number]['id'];
export interface DraftPost {
  id: string;
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
    id: crypto.randomUUID(), brandId, status: 'draft', createdAt: now, updatedAt: now,
    theme: '', instructions: '', platforms: ['instagram'],
    bodies: { instagram: '', threads: '', facebook: '', x: '' },
  };
}

export function validateDraft(draft: DraftPost): string[] {
  const errors: string[] = [];
  if (!draft.theme.trim()) errors.push('投稿テーマを入力してください。');
  if (!draft.platforms.length) errors.push('投稿先SNSを1つ以上選択してください。');
  for (const platform of platforms) {
    if (draft.platforms.includes(platform.id) && !draft.bodies[platform.id].trim()) {
      errors.push(`${platform.name}の投稿文を入力してください。`);
    }
  }
  return errors;
}
