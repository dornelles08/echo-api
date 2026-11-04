import { z } from "zod";

export const fetchPlansQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  name: z.string().optional(),
});

export type FetchPlansQuery = z.infer<typeof fetchPlansQuerySchema>;
