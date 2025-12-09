import { NextRequest, NextResponse } from 'next/server';
import { getUserById, verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/db';
import type { Profile } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    role: string;
    email?: string;
    phone_number?: string;
  };
}

export function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized - No token provided' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload || !payload.userId) {
        console.error('[MIDDLEWARE] Invalid token payload:', payload);
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        );
      }

      if (!supabaseAdmin) {
        console.error('[MIDDLEWARE] supabaseAdmin is undefined');
        console.error('[MIDDLEWARE] Environment check:', {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          isServer: typeof window === 'undefined',
        });
        return NextResponse.json(
          { error: 'Database connection unavailable' },
          { status: 500 }
        );
      }

      const user = await getUserById(payload.userId);
      if (!user) {
        console.error('[MIDDLEWARE] User not found for userId:', payload.userId);
        return NextResponse.json(
          { error: 'Unauthorized - User not found' },
          { status: 401 }
        );
      }
      
      // Attach user info to request
      (req as AuthenticatedRequest).user = {
        userId: user.id,
        role: user.role,
        email: user.email,
        phone_number: user.phone_number,
      };

      return await handler(req as AuthenticatedRequest);
    } catch (error: any) {
      console.error('[MIDDLEWARE] Unexpected error:', error);
      console.error('[MIDDLEWARE] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      return NextResponse.json(
        { 
          error: 'Internal server error during authentication',
          details: error?.message || 'Unknown error'
        },
        { status: 500 }
      );
    }
  };
}

export function requireAdmin(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return requireAuth(async (req) => {
    if (req.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    return handler(req);
  });
}

export function requireDriverOrAdmin(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return requireAuth(async (req) => {
    if (req.user?.role !== 'driver' && req.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Driver or Admin access required' },
        { status: 403 }
      );
    }
    return handler(req);
  });
}

