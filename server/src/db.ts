import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'draft.db');

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id        INTEGER PRIMARY KEY,
    name      TEXT NOT NULL,
    budget    INTEGER NOT NULL DEFAULT 250
  );

  CREATE TABLE IF NOT EXISTS players (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    team_abbr TEXT NOT NULL,
    position  TEXT NOT NULL,
    seed      INTEGER,
    rank      INTEGER,
    UNIQUE(name, team_abbr)
  );

  CREATE TABLE IF NOT EXISTS picks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id  INTEGER NOT NULL REFERENCES players(id),
    team_id    INTEGER NOT NULL REFERENCES teams(id),
    bid_amount INTEGER NOT NULL,
    pick_order INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(player_id)
  );
`);

export default db;
