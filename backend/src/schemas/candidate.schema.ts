import { z } from 'zod';

export const createCandidateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
});

export const updateCandidateValuesSchema = z.object({
  // Map of columnId → value
  values: z.record(z.string().uuid(), z.string().nullable()),
});

export const reorderCandidatesSchema = z.object({
  order: z.array(z.string().uuid()),
});
