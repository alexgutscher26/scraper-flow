import Logo from '@/components/Logo';
import { ThemeModeToggle } from '@/components/ThemeModeToggle';
import { Separator } from '@/components/ui/separator';
import React from 'react';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col">
      {children}
      <Separator />
      <footer className="flex items-center justify-between p-2">
        <Logo iconSize={16} fontSize="text-xl" />
        <ThemeModeToggle />
      </footer>
    </div>
  );
}

export default Layout;
