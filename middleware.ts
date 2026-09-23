import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Local-development middleware. Authentication is handled in the browser
// because this build does not require the Supabase SDK to start.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/dashboard/:path*'] };
