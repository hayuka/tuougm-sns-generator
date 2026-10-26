import { Link } from 'react-router-dom';
import { useBrand } from '../brands/BrandContext';
import { formatDate, overviewByBrand } from '../data/overview';

const metrics = [
  { key: 'content', label: 'コンテンツ数', symbol: '▤', description: 'アイデアと素材のストック' },
  { key: 'drafts', label: '下書き数', symbol: '✎', description: '編集を進めている投稿案' },
  { key: 'review', label: '承認待ち数', symbol: '◷', description: 'レビューを待っている投稿案' },
  { key: 'planned', label: '投稿予定数', symbol: '▦', description: 'カレンダーに登録された計画' },
] as const;

export function Overview() {
  const { brand } = useBrand();
  const data = overviewByBrand[brand.id];
  return <div className="overview" key={brand.id}>
    <section className="page-intro" aria-labelledby="welcome"><div><p className="eyebrow">YOUR BRAND, AT A GLANCE</p><h2 id="welcome">{brand.name} の運用状況</h2><p>{brand.description}。今日のワークスペースを確認しましょう。</p></div><span className="mode-pill">● MANUAL</span></section>
    <div className="sample-notice" role="status"><span aria-hidden="true">ⓘ</span><div><strong>サンプルデータを表示しています</strong><p>数値・投稿予定・履歴はすべてデモ用です。SNSへの接続・自動投稿は行いません。</p></div></div>
    {!data ? <section className="panel empty"><h2>データがありません</h2><p>このブランドのサンプルデータはまだ用意されていません。</p></section> : <>
      <section className="metrics" aria-label="サンプルの運用サマリー">
        {metrics.map((metric) => <article className={`metric metric-${metric.key}`} key={metric.key}><div className="metric-top"><h3>{metric.label}</h3><span className="metric-icon" aria-hidden="true">{metric.symbol}</span></div><p className="metric-value">{data.summary[metric.key]}<span>件</span></p><p className="metric-description">{metric.description}</p></article>)}
      </section>
      <div className="dashboard-grid">
        <section className="panel planned" aria-labelledby="planned-title"><div className="panel-heading"><div><p className="eyebrow">UPCOMING</p><h2 id="planned-title">投稿予定</h2></div><span className="count-badge">{data.posts.length}件</span></div><p className="section-note">サンプルの投稿計画 · {brand.timezone} · 自動公開されません</p>
          {data.posts.length === 0 ? <p className="empty">投稿予定はありません。</p> : <ul className="post-list">{data.posts.map((post) => <li key={post.id}><div className="post-meta"><time dateTime={post.at}>{formatDate(post.at, brand.timezone)}</time><span className={`status ${post.status === '承認済み' ? 'approved' : 'pending'}`}>{post.status}</span></div><h3>{post.title}</h3><div className="post-platform"><span aria-hidden="true">↗</span> {post.platform}<span className="plan-label">投稿計画</span></div></li>)}</ul>}
        </section>
        <section className="panel activity" aria-labelledby="activity-title"><div className="panel-heading"><div><p className="eyebrow">ACTIVITY</p><h2 id="activity-title">最近のアクティビティ</h2></div><span className="subtle-badge">サンプル</span></div>
          {data.activities.length === 0 ? <p className="empty">アクティビティはありません。</p> : <ol className="activity-list">{data.activities.map((activity) => <li key={activity.id}><span className="activity-dot" aria-hidden="true" /><div><p className="activity-type">{activity.type}</p><p className="activity-title">{activity.title}</p><time dateTime={activity.at}>{formatDate(activity.at, brand.timezone)}</time></div></li>)}</ol>}
        </section>
      </div>
    </>}
    <section className="panel quick-actions" aria-labelledby="quick-title"><div><p className="eyebrow">NEXT STEP</p><h2 id="quick-title">クイックアクション</h2><p className="section-note">投稿文を手動で作成し、下書きに保存できます。</p></div><div className="action-links"><Link className="button primary" to="/create">＋ 投稿を作成</Link><Link className="button secondary" to="/content">コンテンツを追加 <small>準備中</small></Link></div></section>
  </div>;
}
