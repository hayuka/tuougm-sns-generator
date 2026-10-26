import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useBrand } from '../brands/BrandContext';
import { platforms } from '../posts/draft';
import type { PlatformId } from '../posts/draft';
import { useDraftWorkspace } from '../posts/DraftWorkspace';
import '../styles/create.css';

export function Create() {
  const { brand } = useBrand();
  return <CreateEditor key={brand.id} />;
}

function CreateEditor() {
  const { brand } = useBrand();
  const { draft, savedAt, dirty, loadError, errors, edit, save, retryLoad } = useDraftWorkspace(brand.id);
  const [active, setActive] = useState<PlatformId>(draft.platforms[0] ?? 'instagram');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const selected = platforms.filter(platform => draft.platforms.includes(platform.id));
  const current = selected.find(platform => platform.id === active) ?? selected[0];
  const body = current ? draft.bodies[current.id] : '';
  const savedTime = savedAt ? new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short', timeZone: brand.timezone }).format(new Date(savedAt)) : null;

  function togglePlatform(id: PlatformId) {
    const next = draft.platforms.includes(id) ? draft.platforms.filter(item => item !== id) : [...draft.platforms, id];
    edit({ platforms: next });
    if (!draft.platforms.includes(id)) setActive(id);
  }
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!current) return;
    const index = selected.findIndex(platform => platform.id === current.id);
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % selected.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + selected.length) % selected.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = selected.length - 1;
    else return;
    event.preventDefault();
    const id = selected[next]!.id;
    setActive(id);
    document.getElementById(`tab-${id}`)?.focus();
  }

  return <div className="create-page">
    <section className="page-intro"><div><p className="eyebrow">TURN YOUR IDEAS INTO WORDS</p><h2>投稿を作成</h2><p>{brand.name} のアイデアを、SNSに合わせた投稿文に。</p></div><span className="mode-pill">● DRAFT</span></section>
    <div className="create-notice"><span aria-hidden="true">✎</span><p>手動で投稿文を作成・編集できます。AI生成・SNS接続・公開はまだ利用できません。</p></div>
    {loadError && <div className="create-error" role="alert"><strong>下書きを読み込めませんでした。</strong><p>保存データの形式、またはブラウザの保存領域に問題があります。既存データを保護するため編集と保存を停止しています。ブラウザ設定を確認して再試行してください。</p><button className="button secondary" onClick={retryLoad}>読み込みを再試行</button></div>}
    <div className="create-grid">
      <section className="panel create-form" aria-labelledby="create-form-title">
        <div className="panel-heading"><div><p className="eyebrow">01 / COMPOSE</p><h2 id="create-form-title">投稿のアイデア</h2></div><span className="subtle-badge">{brand.name}</span></div>
        <fieldset disabled={loadError} className="create-fields"><legend className="visually-hidden">投稿作成フォーム</legend>
          <fieldset className="platform-picker"><legend>投稿先SNS <span className="field-required">必須</span></legend><p className="field-help">複数選択できます。本文はSNSごとに編集できます。</p><div className="platform-options">{platforms.map(platform => <label className="platform-option" key={platform.id}><input type="checkbox" checked={draft.platforms.includes(platform.id)} onChange={() => togglePlatform(platform.id)} /><span className={`platform-icon platform-${platform.id}`} aria-hidden="true">{platform.symbol}</span><span>{platform.name}</span></label>)}</div></fieldset>
          <div className="create-field"><label htmlFor="post-theme">投稿テーマ <span className="field-required">必須</span></label><input id="post-theme" value={draft.theme} onChange={event => edit({ theme: event.target.value })} placeholder="例：新しいプレイリストのご紹介" /><p className="field-help">何について伝えたいですか？</p></div>
          <div className="create-field"><label htmlFor="post-instructions">補足指示 <span className="field-optional">任意</span></label><textarea id="post-instructions" value={draft.instructions} onChange={event => edit({ instructions: event.target.value })} placeholder="伝えたいポイント、トーン、ハッシュタグなど" rows={5} /><p className="field-help">テーマと補足指示は下書きに保存されます。</p></div>
          <div className="compose-actions"><button className="button primary" disabled={!current} onClick={() => editorRef.current?.focus()}>✎ 投稿文を手動で作成</button><button className="button secondary" disabled aria-describedby="ai-unavailable">✧ AIで投稿文を生成 <small>未実装</small></button><p className="field-help" id="ai-unavailable">AIは未接続です。投稿文は手動で入力してください。</p></div>
        </fieldset>
      </section>
      <section className="panel create-editor" aria-labelledby="create-editor-title">
        <div className="panel-heading"><div><p className="eyebrow">02 / EDIT & PREVIEW</p><h2 id="create-editor-title">投稿文を編集</h2></div><span className={`save-state ${savedAt && !dirty ? 'is-saved' : ''}`} role="status">{dirty ? '● 未保存の変更あり' : savedAt ? '✓ 保存済み' : '○ 未保存'}</span></div>
        {selected.length ? <>
          <div className="platform-tabs" role="tablist" aria-label="編集するSNS">{selected.map(platform => <button type="button" role="tab" key={platform.id} id={`tab-${platform.id}`} aria-selected={current?.id === platform.id} aria-controls={`panel-${platform.id}`} tabIndex={current?.id === platform.id ? 0 : -1} onClick={() => setActive(platform.id)} onKeyDown={onTabKey}><span aria-hidden="true">{platform.symbol}</span> {platform.name}</button>)}</div>
          {current && <div role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`} key={current.id}>
            <div className="create-field editor-field"><label htmlFor="post-body">{current.name}の投稿文 <span className="field-required">必須</span></label><textarea id="post-body" ref={editorRef} value={body} disabled={loadError} onChange={event => edit({ bodies: { ...draft.bodies, [current.id]: event.target.value } })} placeholder={`${current.name}に届けたい言葉を入力してください。`} rows={7} /><div className="editor-meta"><span>手動編集 · このSNSだけに反映</span><span>{Array.from(body).length.toLocaleString()}文字</span></div></div>
            <div className="preview-heading"><h3>プレビュー</h3><span>テキスト表示のイメージ</span></div>
            <article className={`social-preview preview-${current.id}`} aria-label={`${current.name}のプレビュー`}><div className="preview-account"><span className="preview-avatar" aria-hidden="true">{brand.name.slice(0, 1)}</span><div><strong>{brand.name}</strong><small>{current.name} · 下書き</small></div><span className="preview-more" aria-hidden="true">•••</span></div>{body.trim() ? <p className="preview-body">{body}</p> : <p className="preview-empty">入力した投稿文がここに表示されます。</p>}<div className="preview-decoration" aria-hidden="true">{current.id === 'facebook' ? '♡ いいね！　 ◯ コメント　 ↗ シェア' : current.id === 'x' ? '◯　　 ⇄　　 ♡　　 ↗' : '♡　　 ◯　　 ↗'}</div></article>
            <p className="field-help preview-note">実際のSNS表示とは異なります。画像・リンクカード・投稿可否の検証は含みません。</p>
          </div>}
        </> : <div className="create-empty"><span aria-hidden="true">▤</span><h3>投稿先SNSを選択してください</h3><p>選択すると、SNSごとに投稿文を編集できます。選択を外しても入力済みの本文は保持されます。</p></div>}
        <div className="draft-save">
          {errors.length > 0 && <div className="create-error" role="alert"><strong>下書きを保存できませんでした</strong><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
          <button className="button primary save-button" disabled={loadError} onClick={save}>下書き保存</button>
          <p role="status" className="field-help">{savedAt && !dirty ? `${savedTime} 保存完了（${brand.timezone}）` : dirty && savedAt ? `前回保存：${savedTime}（${brand.timezone}）。変更を保存してください。` : '下書きはまだ保存されていません。'}</p>
          <p className="field-help storage-note">このブラウザにブランド別で保存します。再読み込み前に保存してください。他の端末とは同期されません。</p>
        </div>
      </section>
    </div>
  </div>;
}
