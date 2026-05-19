export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon?: string;
  category: 'analytics' | 'communication' | 'utility' | 'seo' | 'integration';
  /** HTML/script to inject into public site <head> */
  headSnippet?: string;
  /** HTML to inject before </body> on public site */
  bodySnippet?: string;
  /** Plugin-specific settings schema */
  settings?: PluginSetting[];
  /** Setup instructions shown to admin when configuring */
  setupGuide?: string;
  /** Whether this plugin is recommended for new installs */
  recommended?: boolean;
  /** Preview image URL (screenshot of what it looks like) */
  previewUrl?: string;
}

export interface PluginSetting {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'toggle' | 'select';
  default?: string;
  options?: string[];
  placeholder?: string;
}

export interface InstalledPlugin {
  id: string;
  pluginId: string;
  enabled: boolean;
  settings: Record<string, string>;
  installedAt: string;
}

// --- Plugin Registry (available plugins) ---
const registry = new Map<string, PluginManifest>();

export function registerPlugin(manifest: PluginManifest) {
  registry.set(manifest.id, manifest);
}

export function getAvailablePlugins(): PluginManifest[] {
  return Array.from(registry.values());
}

export function getPluginManifest(id: string): PluginManifest | undefined {
  return registry.get(id);
}

// --- Snippet rendering for public pages ---
export function renderHeadSnippets(installed: InstalledPlugin[]): string {
  return installed
    .filter((p) => p.enabled)
    .map((p) => {
      const manifest = registry.get(p.pluginId);
      if (!manifest?.headSnippet) return '';
      return interpolateSettings(manifest.headSnippet, p.settings);
    })
    .filter(Boolean)
    .join('\n');
}

export function renderBodySnippets(installed: InstalledPlugin[]): string {
  return installed
    .filter((p) => p.enabled)
    .map((p) => {
      const manifest = registry.get(p.pluginId);
      if (!manifest?.bodySnippet) return '';
      return interpolateSettings(manifest.bodySnippet, p.settings);
    })
    .filter(Boolean)
    .join('\n');
}

function interpolateSettings(template: string, settings: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => settings[key] || '');
}
