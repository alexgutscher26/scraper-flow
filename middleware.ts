import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/stripe',
]);

export default clerkMiddleware(async (auth, request) => {
  const url = new URL(request.url);
  const isTrustedApiTarget =
    url.pathname === '/api/workflows/cron' || url.pathname === '/api/workflows/execute';

  if (isTrustedApiTarget) {
    const authHeader = request.headers.get('authorization');
    const apiSecret = process.env.API_SECRET;
    const hasValidBearer =
      !!apiSecret && !!authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] === apiSecret;

    if (!hasValidBearer && !isPublicRoute(request)) {
      await auth.protect();
    }

    const requestHeaders = new Headers(request.headers);
    const userId = (auth as any)?.userId;
    if (userId) {
      requestHeaders.set('x-user-id', userId);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
