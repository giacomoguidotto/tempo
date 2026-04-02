import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

const expo = openDatabaseSync("tempo.db", { enableChangeListener: true });

export const db = drizzle(expo);
