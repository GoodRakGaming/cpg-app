import { NextRequest, NextResponse } from 'next/server';

// Auth cookies are set by the backend on a different port (3000) and
// cannot be read here (middleware runs on port 3001). Auth is handled
// client-side in dashboard/layout.tsx and individual pages.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
