import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

config({ quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

// `prepare: false` because DATABASE_URL may point at a PgBouncer transaction
// pooler (e.g. Supabase's transaction pooler on port 6543), which does not
// support prepared statements. Harmless against a direct connection too.
//
// `queryClient` is exported (not just `db`) so integration tests can close
// the connection pool in an `afterAll` - without that, Jest never sees the
// event loop go idle and hangs after every test has already passed.
export const queryClient = postgres(connectionString, { prepare: false });
export const db = drizzle(queryClient, { schema });
