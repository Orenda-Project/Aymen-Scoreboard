import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'collaborator', 'viewer']),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'collaborator', 'viewer']),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
});
