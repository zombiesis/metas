import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { getAvailablePlugins, getPluginManifest } from '@/lib/plugins';
import '@/lib/sample-plugins';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: list all available plugins + their install status */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const available = getAvailablePlugins();
  const installed = await prisma.installedPlugin.findMany();
  const installedMap = new Map(installed.map((p) => [p.pluginId, p]));

  const plugins = available.map((manifest) => {
    const inst = installedMap.get(manifest.id);
    return {
      ...manifest,
      installed: !!inst,
      enabled: inst?.enabled ?? false,
      settings: inst ? JSON.parse(inst.settings) : {},
      installedAt: inst?.installedAt,
    };
  });

  return NextResponse.json({ ok: true, plugins });
}

/** POST: install, uninstall, toggle, or update settings (Super Admin only) */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  // Plugin snippets render raw HTML on every public page. Audit-#2 N9 narrowed
  // the interpolation escape, but the cleanest defence is to keep this gate
  // tight: only Super Admins can install / configure plugins.
  if (auth.session!.roleName !== 'Super Admin') {
    return NextResponse.json({ ok: false, error: 'Only Super Admin can manage plugins' }, { status: 403 });
  }
  if (!await can(auth.session!.roleName, 'manage_security')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { action, pluginId, settings } = await request.json();
  const manifest = getPluginManifest(pluginId);
  if (!manifest) return NextResponse.json({ ok: false, error: 'Plugin not found' }, { status: 404 });

  switch (action) {
    case 'install':
      await prisma.installedPlugin.upsert({
        where: { pluginId },
        create: { pluginId, enabled: true, settings: JSON.stringify(settings || {}) },
        update: { enabled: true }
      });
      return NextResponse.json({ ok: true, message: `${manifest.name} installed` });

    case 'uninstall':
      await prisma.installedPlugin.delete({ where: { pluginId } }).catch(() => null);
      return NextResponse.json({ ok: true, message: `${manifest.name} uninstalled` });

    case 'toggle':
      const existing = await prisma.installedPlugin.findUnique({ where: { pluginId } });
      if (!existing) return NextResponse.json({ ok: false, error: 'Not installed' }, { status: 400 });
      await prisma.installedPlugin.update({ where: { pluginId }, data: { enabled: !existing.enabled } });
      return NextResponse.json({ ok: true, enabled: !existing.enabled });

    case 'settings':
      await prisma.installedPlugin.update({ where: { pluginId }, data: { settings: JSON.stringify(settings || {}) } });
      return NextResponse.json({ ok: true, message: 'Settings saved' });

    default:
      return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  }
}
