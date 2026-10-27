import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { BrandProvider } from './brands/BrandContext';
import { Layout } from './components/Layout';
import { Content } from './pages/Content';
import './styles/content.css';
import { Create } from './pages/Create';
import { DraftWorkspaceProvider } from './posts/DraftWorkspace';
import { Overview } from './pages/Overview';
import { Placeholder } from './pages/Placeholder';
import './styles/tokens.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><BrowserRouter><BrandProvider><DraftWorkspaceProvider><Routes><Route element={<Layout />}>
    <Route index element={<Navigate to="/overview" replace />} />
    <Route path="overview" element={<Overview />} />
    <Route path="content" element={<Content />} />
    <Route path="create" element={<Create />} />
    <Route path="calendar" element={<Placeholder title="投稿カレンダー" description="カレンダーの表示・編集機能は今後実装予定です。" />} />
    <Route path="settings" element={<Placeholder title="設定" description="ブランド設定・SNSアカウント接続はまだ利用できません。" />} />
    <Route path="*" element={<section className="panel placeholder"><h2>ページが見つかりません</h2><Link to="/overview" className="button primary">Overview に戻る</Link></section>} />
  </Route></Routes></DraftWorkspaceProvider></BrandProvider></BrowserRouter></StrictMode>,
);
