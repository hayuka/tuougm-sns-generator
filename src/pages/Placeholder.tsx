import { Link } from 'react-router-dom';
import { useBrand } from '../brands/BrandContext';

export function Placeholder({ title, description }: { title: string; description: string }) {
  const { brand } = useBrand();
  return <section className="panel placeholder"><span className="placeholder-icon" aria-hidden="true">◇</span><p className="eyebrow">COMING NEXT</p><h2>{title}</h2><span className="subtle-badge">未実装・準備中</span><p>{brand.name} のワークスペースです。{description}</p><p className="section-note">Phase 1 は共通レイアウトと Overview のみを提供しています。</p><Link to="/overview" className="button primary">Overview に戻る</Link></section>;
}
