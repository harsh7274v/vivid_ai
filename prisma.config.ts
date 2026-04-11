import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Use direct Neon connection for Prisma CLI (migrate, db push)
    url: env("DIRECT_URL"),
  },
});
