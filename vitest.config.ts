import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.spec.ts"],
          environment: "node",
          setupFiles: ["./tests/setup-env.ts"],
        },
      },
      {
        test: {
          name: "e2e",
          include: ["tests/e2e/**/*.e2e.spec.ts"],
          environment: "node",
          setupFiles: ["./tests/e2e/setup.ts"],
          testTimeout: 30000,
          hookTimeout: 60000,
        },
      },
    ],
  },
});
