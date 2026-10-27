import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
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
const keyOf = (brandId: string, id: string) => JSON.stringify([brandId, id]);
const message = (error: unknown) => error instanceof Error ? error.message : '保存領域にアクセスできませんでした。';
interface WorkspaceContext {
  entries: Record<string, Workspace>;
  newIds: Record<string, string>;
  version: number;
  open: (brandId: string, id: string | null, reload?: boolean) => void;
  edit: (brandId: string, id: string, changes: Partial<DraftChanges>) => void;
  save: (brandId: string, id: string) => DraftPost | null;
  discardNew: (brandId: string) => void;
  remove: (brandId: string, id: string, revision: number) => void;
}
const Context = createContext<WorkspaceContext | null>(null);

export function DraftWorkspaceProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, Workspace>>({});
  const entriesRef = useRef(entries);
  const [newIds, setNewIds] = useState<Record<string, string>>({});
  const newIdsRef = useRef(newIds);
  const [version, setVersion] = useState(0);
  function publish(key: string, workspace: Workspace) {
    entriesRef.current = { ...entriesRef.current, [key]: workspace };
    setEntries(entriesRef.current);
  }
  function open(brandId: string, id: string | null, reload = false) {
    const existingId = id ?? newIdsRef.current[brandId];
    if (existingId && entriesRef.current[keyOf(brandId, existingId)] && !reload) return;
    const empty = createDraft(brandId);
    const draftId = id ?? existingId ?? empty.id;
    if (!id) {
      newIdsRef.current = { ...newIdsRef.current, [brandId]: draftId };
      setNewIds(newIdsRef.current);
    }
    let workspace: Workspace;
    try {
      const saved = id ? localDraftRepository.get(brandId, id) : null;
      if (id && !saved) throw new Error('投稿は存在しないか、別のブランドの投稿です。新規投稿としては開きません。');
      if (!id) localDraftRepository.list(brandId); // Validate/migrate before allowing a new write.
      workspace = { draft: saved ?? { ...empty, id: draftId }, savedAt: saved?.updatedAt ?? null, dirty: false, loadError: false, errors: [] };
    } catch (error) {
      workspace = { draft: { ...empty, id: draftId }, savedAt: null, dirty: false, loadError: true, errors: [message(error)] };
    }
    publish(keyOf(brandId, draftId), workspace);
  }
  function edit(brandId: string, id: string, changes: Partial<DraftChanges>) {
    const key = keyOf(brandId, id);
    const workspace = entriesRef.current[key];
    if (!workspace || workspace.loadError) return;
    publish(key, { ...workspace, draft: { ...workspace.draft, ...changes }, dirty: true, errors: [] });
  }
  function save(brandId: string, id: string) {
    const key = keyOf(brandId, id);
    const workspace = entriesRef.current[key];
    if (!workspace || workspace.loadError) return null;
    const errors = validateDraft(workspace.draft);
    if (errors.length) { publish(key, { ...workspace, errors }); return null; }
    try {
      const saved = workspace.savedAt
        ? localDraftRepository.update(workspace.draft, workspace.draft.revision)
        : localDraftRepository.create(workspace.draft);
      publish(key, { ...workspace, draft: saved, savedAt: saved.updatedAt, dirty: false, errors: [] });
      if (newIdsRef.current[brandId] === id) {
        const next = { ...newIdsRef.current }; delete next[brandId];
        newIdsRef.current = next; setNewIds(next);
      }
      setVersion(current => current + 1);
      return saved;
    } catch (error) {
      publish(key, { ...workspace, errors: [`保存できませんでした。${message(error)} 入力内容は保持しています。`] });
      return null;
    }
  }
  function discardNew(brandId: string) {
    const id = newIdsRef.current[brandId];
    if (id) {
      const next = { ...entriesRef.current }; delete next[keyOf(brandId, id)];
      entriesRef.current = next; setEntries(next);
      const ids = { ...newIdsRef.current }; delete ids[brandId];
      newIdsRef.current = ids; setNewIds(ids);
    }
    open(brandId, null);
  }
  function remove(brandId: string, id: string, revision: number) {
    localDraftRepository.delete(brandId, id, revision);
    const next = { ...entriesRef.current }; delete next[keyOf(brandId, id)];
    entriesRef.current = next; setEntries(next);
    setVersion(current => current + 1);
  }
  const hasUnsaved = Object.values(entries).some(workspace => workspace.dirty);
  useEffect(() => {
    if (!hasUnsaved) return;
    const onLeave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [hasUnsaved]);
  useEffect(() => {
    const changed = () => setVersion(current => current + 1);
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  return <Context.Provider value={{ entries, newIds, version, open, edit, save, discardNew, remove }}>{children}</Context.Provider>;
}

export function useDraftCollection() {
  const context = useContext(Context);
  if (!context) throw new Error('DraftWorkspaceProvider is required');
  return context;
}
export function useDraftWorkspace(brandId: string, postId: string | null) {
  const context = useDraftCollection();
  const id = postId ?? context.newIds[brandId];
  const workspace = id ? context.entries[keyOf(brandId, id)] : undefined;
  useEffect(() => { context.open(brandId, postId); }, [brandId, postId]);
  return {
    workspace,
    edit: (changes: Partial<DraftChanges>) => { if (id) context.edit(brandId, id, changes); },
    save: () => id ? context.save(brandId, id) : null,
    retryLoad: () => context.open(brandId, postId, true),
    discardNew: () => context.discardNew(brandId),
  };
}
export const workspaceKey = keyOf;
