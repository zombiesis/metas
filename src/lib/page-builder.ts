import { z } from 'zod';

/** Block types for the page builder */
export const BLOCK_TYPES = ['hero', 'text', 'gallery', 'cta', 'faq', 'stats', 'video', 'testimonial', 'cards'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export type PageBlock = {
  id: string;
  type: BlockType;
  order: number;
  visible: boolean;
  data: Record<string, unknown>;
};

/** Block schemas for validation */
const blockSchemas: Record<BlockType, z.ZodType> = {
  hero: z.object({ title: z.string().max(200), subtitle: z.string().max(500).optional(), image: z.string().max(500).optional(), cta: z.string().max(100).optional(), ctaUrl: z.string().max(500).optional() }),
  text: z.object({ heading: z.string().max(200).optional(), body: z.string().max(50000) }),
  gallery: z.object({ heading: z.string().max(200).optional(), images: z.array(z.object({ url: z.string(), alt: z.string().max(200).optional(), caption: z.string().max(500).optional() })).max(50) }),
  cta: z.object({ heading: z.string().max(200), description: z.string().max(500).optional(), buttonText: z.string().max(100), buttonUrl: z.string().max(500), variant: z.enum(['primary', 'secondary', 'outline']).optional() }),
  faq: z.object({ heading: z.string().max(200).optional(), items: z.array(z.object({ question: z.string().max(500), answer: z.string().max(5000) })).max(50) }),
  stats: z.object({ heading: z.string().max(200).optional(), items: z.array(z.object({ value: z.string().max(20), label: z.string().max(100), suffix: z.string().max(10).optional() })).max(10) }),
  video: z.object({ heading: z.string().max(200).optional(), url: z.string().max(500), caption: z.string().max(500).optional() }),
  testimonial: z.object({ heading: z.string().max(200).optional(), items: z.array(z.object({ quote: z.string().max(1000), name: z.string().max(100), role: z.string().max(100).optional(), photo: z.string().max(500).optional() })).max(20) }),
  cards: z.object({ heading: z.string().max(200).optional(), columns: z.number().min(1).max(4).optional(), items: z.array(z.object({ title: z.string().max(200), description: z.string().max(1000).optional(), image: z.string().max(500).optional(), link: z.string().max(500).optional() })).max(20) }),
};

/** Validate a block's data */
export function validateBlock(type: BlockType, data: unknown): unknown {
  const schema = blockSchemas[type];
  if (!schema) throw new Error(`Unknown block type: ${type}`);
  return schema.parse(data);
}

/** Parse page body as blocks (stored as JSON in page.metadata) */
export function parseBlocks(metadata: string): PageBlock[] {
  try {
    const parsed = JSON.parse(metadata);
    return Array.isArray(parsed.blocks) ? parsed.blocks : [];
  } catch { return []; }
}

/** Serialize blocks back to metadata JSON */
export function serializeBlocks(blocks: PageBlock[]): string {
  return JSON.stringify({ blocks });
}

/** Generate a unique block ID */
export function newBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
