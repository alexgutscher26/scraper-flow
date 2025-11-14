import React from 'react';
import DesktopSidebar from '@/components/Sidebar';
import { Separator } from '@/components/ui/separator';
import BreadcrumbHeader from '@/components/BreadcrumbHeader';
import { ThemeModeToggle } from '@/components/ThemeModeToggle';
import { SignedIn, UserButton } from '@clerk/nextjs';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <DesktopSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="container flex h-[50px] items-center justify-between px-6 py-4">
          <BreadcrumbHeader />
          <div className="flex items-center gap-1">
            <ThemeModeToggle />
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </header>
        <Separator />
        <div className="overflow-auto">
          <div className="container flex-1 py-4 text-accent-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
