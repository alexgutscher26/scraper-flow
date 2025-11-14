'use client';
import { CoinsIcon, HomeIcon, Layers2Icon, MenuIcon, ShieldCheckIcon } from 'lucide-react';
import React from 'react';
import Logo from './Logo';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import UserAvailableCreditsBadge from './UserAvailableCreditsBadge';

const routes = [
  {
    href: '',
    label: 'Home',
    icon: HomeIcon,
  },
  {
    href: 'workflows',
    label: 'Workflows',
    icon: Layers2Icon,
  },
  {
    href: 'credentials',
    label: 'Credentials',
    icon: ShieldCheckIcon,
  },
  {
    href: 'billing',
    label: 'Billing',
    icon: CoinsIcon,
  },
];

/**
 * Renders the desktop sidebar component.
 *
 * The DesktopSidebar function utilizes the usePathname hook to determine the current route. It then finds the active route from the routes array based on the pathname. The sidebar displays a logo, user credits, and a list of links for navigation, highlighting the active route. The layout is responsive and styled for desktop view.
 */
function DesktopSidebar() {
  const pathname = usePathname();
  const activeRoute = React.useMemo(() => {
    return (
      routes.find((route) => route.href.length > 0 && pathname.includes(route.href)) || routes[0]
    );
  }, [pathname]);
  return (
    <div className="relative hidden h-screen w-full min-w-[280px] max-w-[280px] border-separate overflow-hidden border-r-2 bg-primary/5 text-muted-foreground dark:bg-secondary/30 dark:text-foreground md:block">
      <div className="flex border-separate items-center justify-center gap-2 border-b-[1px] p-4">
        <Logo />
      </div>
      <div className="p-2">
        <UserAvailableCreditsBadge />
      </div>
      <div className="flex flex-col gap-2 p-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={`/${route.href}`}
            className={buttonVariants({
              variant: activeRoute.href === route.href ? 'sidebarActiveItem' : 'sidebarIcon',
            })}
          >
            <route.icon size={20} />
            <span>{route.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default React.memo(DesktopSidebar);

export const MobileSidebar = React.memo(function MobileSidebar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const activeRoute = React.useMemo(() => {
    return (
      routes.find((route) => route.href.length > 0 && pathname.includes(route.href)) || routes[0]
    );
  }, [pathname]);
  const handleRouteClick = React.useCallback(() => {
    setOpen(false);
  }, []);
  return (
    <div className="block border-separate bg-background md:hidden">
      <nav className="container flex items-center justify-between px-8">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant={'ghost'} size={'icon'}>
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] space-y-4 sm:w-[540px]" side={'left'}>
            <Logo />
            <UserAvailableCreditsBadge />
            <div className="flex flex-col gap-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={`/${route.href}`}
                  className={buttonVariants({
                    variant: activeRoute.href === route.href ? 'sidebarActiveItem' : 'sidebarIcon',
                  })}
                  onClick={handleRouteClick}
                >
                  <route.icon size={20} />
                  <span>{route.label}</span>
                </Link>
              ))}{' '}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
});
