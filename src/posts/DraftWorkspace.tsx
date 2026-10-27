import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { brands } from '../brands/brands';
import { createDraft, validateDraft } from './draft';
import type { DraftPost } from './draft';
import { localDraftRepository } from './draftRepository';

interface Workspace {
  draft: DraftPost;
  savedAt: string | null;
  dirty: boolean;
  loadError: boolean;
  errors: string[];
}
type DraftChanges = Pick<DraftPost, 'theme' | 'instructions' | 'platforms' | 'bodies'>;
interface WorkspaceContext {
  workspaces: Record<string, Workspace>;
  edit: (brandId: string, changes: Partial<DraftChanges>) => void;
  save: (brandId: string) => void;
  retryLoad: (brandId: string) => void;
}
const Context = createContext<WorkspaceContext | null>(null);
function loadWorkspace(brandId: string): Workspace {
  try {
    const saved = localDraftRepository.load(brandId);
    return { draft: saved ?? createDraft(brandId), savedAt: saved?.updatedAt ?? null, dirty: false, loadError: false, errors: [] };
  } catch {
    return { draft: createDraft(brandId), savedAt: null, dirty: false, loadError: true, errors: [] };
  }
}

export function DraftWorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Record<string, Workspace>>(() =>
    Object.fromEntries(brands.map(brand => [brand.id, loadWorkspace(brand.id)])));
  const hasUnsaved = Object.values(workspaces).some(workspace => workspace.dirty);
  useEffect(() => {
    if (!hasUnsaved) return;
    const onLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [hasUnsaved]);

  function update(brandId: string, workspace: Workspace) {
    setWorkspaces(current => ({ ...current, [brandId]: workspace }));
  }
  function edit(brandId: string, changes: Partial<DraftChanges>) {
    setWorkspaces(current => {
      const workspace = current[brandId]!;
      return { ...current, [brandId]: { ...workspace, draft: { ...workspace.draft, ...changes }, dirty: true, errors: [] } };
    });
  }
  function save(brandId: string) {
    const workspace = workspaces[brandId]!;
    if (workspace.loadError) return;
    const errors = validateDraft(workspace.draft);
    if (errors.length) { update(brandId, { ...workspace, errors }); return; }
    const draft = { ...workspace.draft, updatedAt: new Date().toISOString() };
    try {
      localDraftRepository.save(draft);
      update(brandId, { ...workspace, draft, savedAt: draft.updatedAt, dirty: false, errors: [] });
    } catch {
      update(brandId, { ...workspace, errors: ['保存できませんでした。ブラウザの保存領域や設定を確認し、もう一度「下書き保存」を押してください。入力内容はこの画面に保持しています。'] });
    }
  }
  function retryLoad(brandId: string) {
    // Loading is retried only while editing is locked, so it cannot replace manual edits.
    if (workspaces[brandId]?.loadError) update(brandId, loadWorkspace(brandId));
  }
  return <Context.Provider value={{ workspaces, edit, save, retryLoad }}>{children}</Context.Provider>;
}

export function useDraftWorkspace(brandId: string) {
  const context = useContext(Context);
  if (!context) throw new Error('DraftWorkspaceProvider is required');
  return { ...context.workspaces[brandId]!, edit: (changes: Partial<DraftChanges>) => context.edit(brandId, changes), save: () => context.save(brandId), retryLoad: () => context.retryLoad(brandId) };
}
