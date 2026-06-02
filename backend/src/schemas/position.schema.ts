import { z } from 'zod';

export const createPositionSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const updatePositionSchema = createPositionSchema.partial().extend({
  isActive: z.boolean().optional(),
  isCollapsed: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const createColumnSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['text', 'status', 'date', 'file', 'percentage', 'number', 'email', 'phone']),
});

export const updateColumnSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const reorderColumnsSchema = z.object({
  order: z.array(z.string().uuid()), // array of column IDs in desired order
});

export const createCustomStatusSchema = z.object({
  name: z.string().min(1).max(100),
  colorClass: z.string().min(1),
});
