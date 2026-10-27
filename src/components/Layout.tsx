import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useBrand } from '../brands/BrandContext';
import { Sidebar } from './Sidebar';
import { navigation } from './navigation';

export function Layout() {
  const { brand } = useBrand();
  const location = useLocation();
  const current = navigation.find((item) => item.path === location.pathname);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRoute = useRef(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    else if (!open && dialog?.open) dialog.close();
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previous; };
    }
  }, [open]);
  useEffect(() => {
    document.title = `${current?.title ?? 'ページが見つかりません'} · ${brand.name} | SNS GENERATOR`;
  }, [current, brand.name]);
  useEffect(() => {
    if (!firstRoute.current) headingRef.current?.focus();
    firstRoute.current = false;
  }, [location.pathname]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)');
    const onChange = () => { if (media.matches) setOpen(false); };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  function closeMenu() { setOpen(false); menuRef.current?.focus(); }

  return <div className="app" style={{ '--brand-accent': brand.accent } as CSSProperties}>
    <a className="skip-link" href="#main">本文へスキップ</a>
    <aside className="desktop-sidebar"><Sidebar close={() => {}} /></aside>
    <dialog className="mobile-menu" ref={dialogRef} aria-label="ナビゲーション" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
      <div className="mobile-sidebar"><button className="menu-close" onClick={closeMenu} autoFocus>閉じる ×</button>{open && <Sidebar close={closeMenu} />}</div>
    </dialog>
    <div className="workspace">
      <header className="header">
        <div className="header-title"><button ref={menuRef} className="menu-button" aria-label="ナビゲーションを開く" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(true)}>☰</button><div><span className="breadcrumb">ワークスペース / {current?.label ?? 'ページ不明'}</span><h1 ref={headingRef} tabIndex={-1}>{current?.title ?? 'ページが見つかりません'}</h1></div></div>
        <div className="header-brand"><span className="brand-avatar" aria-hidden="true">{brand.name.slice(0, 1)}</span><span>{brand.name}<small>選択中のブランド</small></span></div>
      </header>
      <main id="main" tabIndex={-1}><Outlet /></main>
      <footer className="workspace-footer">SNS GENERATOR <span>Phase 3 — Content Workspace</span></footer>
    </div>
  </div>;
}
