'use client';

import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  role: string;
  email?: string;
  phone_number?: string;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

