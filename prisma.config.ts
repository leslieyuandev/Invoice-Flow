import { defineConfig } from "prisma/config";

// Prisma 7: database URL lives here, not in schema.prisma.
// The CLI picks this up automatically when running prisma commands.
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? (() => { throw new Error("DATABASE_URL is not set"); })(),
  },
});
