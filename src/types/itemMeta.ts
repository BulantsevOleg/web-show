import { z } from "zod";

export const ItemMetaSchema = z.object({
  name: z.string(),
  slug: z.string(),
  article: z.object({
    blocks: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    wbLink: z.string().optional(),
    tocBefore1: z.string().optional(),
    tocBefore2: z.string().optional(),
    tocBefore5: z.string().optional(),
    tocBefore6: z.string().optional(),
  }).default({ blocks: [], images: [] }),
  updatedAt: z.string().optional(),
});

export type ItemMeta = z.infer<typeof ItemMetaSchema>;
