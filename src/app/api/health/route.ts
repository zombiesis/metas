import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}
  const status = dbOk ? 'healthy' : 'degraded';
  return NextResponse.json({ status, db: dbOk, uptime: process.uptime(), latencyMs: Date.now() - start }, { status: dbOk ? 200 : 503 });
}
