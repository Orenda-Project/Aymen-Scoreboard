import { z } from 'zod';

export const addEmailSchema = z.object({
  email: z.string().email(),
});
