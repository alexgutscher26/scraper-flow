import { GetAvailableCredits } from '@/actions/billing/getAvailableCredits';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { CoinsIcon, Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import ReactCountUpWrapper from './ReactCountUpWrapper';
import { buttonVariants } from './ui/button';

function UserAvailableCreditsBadge() {
  const query = useQuery({
    queryKey: ['user-available-credits'],
    queryFn: () => GetAvailableCredits(),
    // refetchInterval: 120 * 1000, // 60 seconds TODO
  });
  return (
    <Link
      href="/billing"
      className={cn('w-full items-center space-x-2', buttonVariants({ variant: 'outline' }))}
    >
      <CoinsIcon size={20} className="text-primary" />
      <span className=" font-semibold capitalize">
        {query.isLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}
        {!query.isLoading && typeof query.data === 'number' && (
          <ReactCountUpWrapper value={Math.max(0, query.data)} />
        )}
        {!query.isLoading && query.data === undefined && '-'}
      </span>
    </Link>
  );
}

export default UserAvailableCreditsBadge;
