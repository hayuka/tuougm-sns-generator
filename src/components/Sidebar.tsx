import { useId } from 'react';
import { NavLink } from 'react-router-dom';
import { useBrand } from '../brands/BrandContext';
import { brands } from '../brands/brands';
import { navigation } from './navigation';

export function Sidebar({ close }: { close: () => void }) {
  const { brand, selectBrand } = useBrand();
  const brandSelectId = useId();
  return <>
    <div className="logo"><span className="logo-mark" aria-hidden="true">S</span><span>SNS GENERATOR<small>BRAND WORKSPACE</small></span></div>
    <div className="brand-picker">
      <label htmlFor={brandSelectId}>ワークスペース / ブランド</label>
      <select id={brandSelectId} value={brand.id} onChange={(event) => selectBrand(event.target.value)}>
        {brands.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
      </select>
      <span className="brand-hint"><i /> ブランドごとにデータを管理</span>
    </div>
    <p className="nav-caption">WORKSPACE</p>
    <nav aria-label="メインナビゲーション">
      {navigation.map((item) => <NavLink to={item.path} key={item.path} onClick={close} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <span className="nav-symbol" aria-hidden="true">{item.symbol}</span><span>{item.title}<small>{item.label}</small></span>
        {item.path !== '/overview' && item.path !== '/create' && <span className="nav-soon">準備中</span>}
      </NavLink>)}
    </nav>
    <div className="sidebar-footer"><span className="mode-dot" /> MANUAL モード<p>Overview はサンプルデータ</p></div>
  </>;
}
