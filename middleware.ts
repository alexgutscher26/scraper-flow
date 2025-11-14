import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/workflows/cron",
  "/api/workflows/execute",
  "/api/webhooks/stripe",
]);

export default clerkMiddleware(async (auth, request) => {
  const url = new URL(request.url);
  const isApiTarget = url.pathname === "/api/workflows/cron" || url.pathname === "/api/workflows/execute";
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
  if (isApiTarget) {
    const requestHeaders = new Headers(request.headers);
    if (auth.userId) {
      requestHeaders.set("x-user-id", auth.userId);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
