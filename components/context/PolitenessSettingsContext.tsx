'use client';
import { createContext, useState, Dispatch, SetStateAction } from 'react';
import { PolitenessConfig, defaultPolitenessConfig } from '@/types/politeness';

type Ctx = {
  config: PolitenessConfig;
  setConfig: Dispatch<SetStateAction<PolitenessConfig>>;
};

export const PolitenessSettingsContext = createContext<Ctx | null>(null);

export function PolitenessSettingsProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: PolitenessConfig;
}) {
  const [config, setConfig] = useState<PolitenessConfig>(initial ?? defaultPolitenessConfig());
  return (
    <PolitenessSettingsContext.Provider value={{ config, setConfig }}>
      {children}
    </PolitenessSettingsContext.Provider>
  );
}
