import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { BrandProvider } from './brands/BrandContext';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Placeholder } from './pages/Placeholder';
import './styles/tokens.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><BrandProvider><Routes><Route element={<Layout />}>
    <Route index element={<Navigate to="/overview" replace />} />
    <Route path="overview" element={<Overview />} />
    <Route path="content" element={<Placeholder title="コンテンツ" description="コンテンツの追加・管理機能は今後実装予定です。" />} />
    <Route path="create" element={<Placeholder title="投稿を作成" description="投稿の作成・AI生成機能はまだ利用できません。" />} />
    <Route path="calendar" element={<Placeholder title="投稿カレンダー" description="カレンダーの表示・編集機能は今後実装予定です。" />} />
    <Route path="settings" element={<Placeholder title="設定" description="ブランド設定・SNSアカウント接続はまだ利用できません。" />} />
    <Route path="*" element={<section className="panel placeholder"><h2>ページが見つかりません</h2><Link to="/overview" className="button primary">Overview に戻る</Link></section>} />
  </Route></Routes></BrandProvider></BrowserRouter></StrictMode>,
);
