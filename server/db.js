import Database from "better-sqlite3";

const db = new Database("overlay.db");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY,
    key TEXT UNIQUE,
    value TEXT
  )
`
).run();

export function getAllProgress() {
  const rows = db.prepare(`SELECT key, value FROM progress`).all();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function setProgress(key, value) {
  db.prepare(
    `
    INSERT INTO progress (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `
  ).run(key, value);
}
