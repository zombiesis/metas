import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Minimal health check — reveals nothing about internals */
export async function GET() {
  let ok = false;
  try { await prisma.$queryRaw`SELECT 1`; ok = true; } catch {}
  return NextResponse.json({ status: ok ? 'ok' : 'error' }, { status: ok ? 200 : 503 });
}
