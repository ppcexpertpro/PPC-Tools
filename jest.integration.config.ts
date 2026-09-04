import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/integration"],
  testTimeout: 30000,
  // These tests share one live database and clean up with blunt TRUNCATEs.
  // Jest's default parallel-file workers would let one file's beforeEach
  // wipe rows another file's test just inserted mid-test - serial execution
  // is required, the same reason playwright.config.ts pins workers to 1.
  maxWorkers: 1,
};

export default createJestConfig(config);
