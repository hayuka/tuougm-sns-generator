import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { brands } from './brands';
import type { Brand } from './brands';

const BrandContext = createContext<{ brand: Brand; selectBrand: (id: string) => void } | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<Brand>(brands[0]!);
  function selectBrand(id: string) {
    const next = brands.find((item) => item.id === id);
    if (next) setBrand(next);
  }
  return <BrandContext.Provider value={{ brand, selectBrand }}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) throw new Error('BrandProvider is required');
  return context;
}
