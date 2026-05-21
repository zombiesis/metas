import { NextRequest } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory event bus (per-process; use Redis pub/sub for multi-instance)
const clients = new Set<ReadableStreamDefaultController>();

/** Push an event to all connected admin clients */
export function pushEvent(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const controller of clients) {
    try { controller.enqueue(new TextEncoder().encode(msg)); } catch { clients.delete(controller); }
  }
}

/** GET: SSE stream for real-time admin notifications */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      controller.enqueue(new TextEncoder().encode(`event: connected\ndata: {"user":"${auth.session!.username}"}\n\n`));
      request.signal.addEventListener('abort', () => { clients.delete(controller); });
    },
    cancel(controller) { clients.delete(controller); },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
}
