import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
});

export function parseEnv(source: Record<string, string | undefined>) {
  return schema.parse(source);
}
