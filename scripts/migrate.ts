import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "mesh_metadata.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    filename TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const applied = new Set(
  db.prepare("SELECT filename FROM _migrations").all().map((r: any) => r.filename)
);

const files = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
  console.log(`  Applying ${file}...`);
  db.exec(sql);
  db.prepare("INSERT INTO _migrations (filename) VALUES (?)").run(file);
  count++;
}

console.log(count > 0 ? `Done. Applied ${count} migration(s).` : "Database is up to date.");
db.close();
