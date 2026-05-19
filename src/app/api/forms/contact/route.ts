import { NextRequest } from 'next/server';
import { handlePublicForm } from '@/lib/form-handlers';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) { return handlePublicForm('contact' as any, request); }
