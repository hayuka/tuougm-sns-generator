import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBrand } from '../brands/BrandContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { platforms } from '../posts/draft';
import type { DraftPost, PlatformId } from '../posts/draft';
import { localDraftRepository } from '../posts/draftRepository';
import { useDraftCollection, workspaceKey } from '../posts/DraftWorkspace';
import '../styles/content.css';

export function Content() {
  const { brand } = useBrand();
  return <ContentList key={brand.id} />;
}
function ContentList() {
  const { brand } = useBrand();
  const { entries, newIds, version, remove } = useDraftCollection();
  const [posts, setPosts] = useState<DraftPost[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [filter, setFilter] = useState<PlatformId | 'all'>('all');
  const [pending, setPending] = useState<DraftPost | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const newId = newIds[brand.id];
  const hasNew = newId && entries[workspaceKey(brand.id, newId)]?.dirty;
  function refresh() {
    try { setPosts(localDraftRepository.list(brand.id)); setLoadError(''); }
    catch { setLoadError('保存済み投稿を読み込めませんでした。保存領域が利用できないか、データの形式・移行元との整合性に問題があります。既存データは初期化していません。'); }
  }
  useEffect(refresh, [brand.id, version]);
  const filtered = posts?.filter(post => filter === 'all' || post.platforms.includes(filter)) ?? [];
  const date = (at: string) => new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short', timeZone: brand.timezone }).format(new Date(at));
  function confirmDelete() {
    if (!pending) return;
    try {
      remove(brand.id, pending.id, pending.revision);
      setNotice('投稿を削除しました。'); setDeleteError(''); setPending(null);
      requestAnimationFrame(() => titleRef.current?.focus());
    } catch (error) {
      setDeleteError(`削除できませんでした。投稿は一覧に保持しています。${error instanceof Error ? error.message : '保存領域を確認して再試行してください。'}`);
      setPending(null);
    }
  }
  return <div className="content-page">
    <section className="page-intro"><div><p className="eyebrow">YOUR CONTENT LIBRARY</p><h2 ref={titleRef} tabIndex={-1}>投稿一覧</h2><p>{brand.name} · {loadError || posts === null ? '保存件数を確認できません' : `保存済み ${posts.length}件`}</p></div><Link className="button primary" to="/create">＋ 新規投稿</Link></section>
    <p className="content-storage-note">このブラウザに保存された下書きです。他の端末とは同期されません。日時は {brand.timezone} で表示します。</p>
    {hasNew && <div className="resume-notice"><span>未保存の新規投稿があります。</span><Link className="button secondary" to="/create">作業を再開</Link></div>}
    {notice && <p role="status" className="content-success">{notice}</p>}
    {deleteError && <div className="create-error" role="alert">{deleteError}<button className="button secondary" onClick={refresh}>一覧を再読み込み</button></div>}
    {loadError ? <section className="panel"><div className="create-error" role="alert">{loadError}</div><button className="button secondary" onClick={refresh}>読み込みを再試行</button></section> : posts === null ? <p role="status">投稿を読み込んでいます…</p> : <section className="panel content-panel" aria-label="保存済み投稿">
      <div className="content-filter"><label htmlFor="content-platform">SNS媒体<select id="content-platform" value={filter} onChange={event => setFilter(event.target.value as PlatformId | 'all')}><option value="all">すべて</option>{platforms.map(platform => <option key={platform.id} value={platform.id}>{platform.name}</option>)}</select></label><p>最終更新が新しい順 · {filtered.length}件表示</p></div>
      {posts.length === 0 ? <div className="content-empty"><span aria-hidden="true">▤</span><h3>まだ投稿がありません</h3><p>テーマだけでも保存できます。最初のアイデアを残しましょう。</p><Link className="button primary" to="/create">＋ 最初の投稿を作成</Link></div> : filtered.length === 0 ? <div className="content-empty"><h3>該当する投稿はありません</h3><p>別のSNSを選択するか、絞り込みを解除してください。</p><button className="button secondary" onClick={() => setFilter('all')}>絞り込みを解除</button></div> : <>
        <div className="content-columns" aria-hidden="true"><span>投稿テーマ・本文</span><span>最終更新</span><span>ステータス</span><span>操作</span></div>
        <ul className="content-list">{filtered.map(post => {
          const selected = platforms.filter(platform => post.platforms.includes(platform.id));
          const excerptPlatform = filter === 'all' ? selected[0] : platforms.find(platform => platform.id === filter);
          const excerpt = excerptPlatform ? post.bodies[excerptPlatform.id] : '';
          const dirty = entries[workspaceKey(brand.id, post.id)]?.dirty;
          return <li key={post.id} className="content-row">
            <div className="content-post"><h3><Link to={`/create?draft=${encodeURIComponent(post.id)}`}>{post.theme}</Link></h3><div className="content-platforms">{selected.length ? selected.map(platform => <span key={platform.id}><span aria-hidden="true">{platform.symbol}</span> {platform.name}</span>) : <span>SNS未選択</span>}</div><p className="content-excerpt">{excerpt.trim() || '本文はまだ入力されていません。'}</p>{excerptPlatform && <p className="excerpt-source">{excerptPlatform.name}の本文</p>}{dirty && <p className="content-unsaved">未保存の変更あり · 編集から再開できます</p>}</div>
            <time dateTime={post.updatedAt}>{date(post.updatedAt)}</time><span className="content-status">下書き</span>
            <div className="content-actions"><Link className="button secondary" to={`/create?draft=${encodeURIComponent(post.id)}`} aria-label={`${post.theme}を編集`}>編集</Link><details className="post-more" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}><summary aria-label={`${post.theme}のその他の操作`}>その他 <span aria-hidden="true">⋯</span></summary><button className="delete-action" onClick={event => { const details = event.currentTarget.closest('details'); if (details) { details.open = false; details.querySelector('summary')?.focus(); } setPending(post); }}>削除</button></details></div>
          </li>;
        })}</ul>
      </>}
    </section>}
    {pending && <ConfirmDialog title="投稿を削除しますか？" confirmLabel="削除する" onCancel={() => setPending(null)} onConfirm={confirmDelete}><p>{brand.name} の「{pending.theme}」を削除します。この操作は取り消せません。</p>{entries[workspaceKey(brand.id, pending.id)]?.dirty && <p>この投稿の未保存の変更も破棄されます。</p>}</ConfirmDialog>}
  </div>;
}
