import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
// biome-ignore lint/performance/noNamespaceImport: drizzle requires schema namespace
import * as schema from "./schema";

const expo = openDatabaseSync("tempo.db", { enableChangeListener: true });

export const db = drizzle(expo, { schema });
