import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface PlayerData {
  name: string;
  teamAbbr: string;
  position: string;
  seed: number | null;
}

export function seedDatabase() {
  const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number };

  if (teamCount.count === 0) {
    const insertTeam = db.prepare('INSERT INTO teams (id, name, budget) VALUES (?, ?, ?)');
    for (let i = 1; i <= 6; i++) {
      insertTeam.run(i, `Team ${i}`, 250);
    }
    console.log('Seeded 6 teams');
  }

  const playerCount = db.prepare('SELECT COUNT(*) as count FROM players').get() as { count: number };

  if (playerCount.count === 0) {
    const playersPath = path.join(__dirname, '..', 'src', 'data', 'players.json');
    const fallbackPath = path.join(__dirname, 'data', 'players.json');
    const filePath = fs.existsSync(playersPath) ? playersPath : fallbackPath;
    const players: PlayerData[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const insertPlayer = db.prepare(
      'INSERT OR IGNORE INTO players (name, team_abbr, position, seed) VALUES (?, ?, ?, ?)'
    );
    const insertMany = db.transaction((items: PlayerData[]) => {
      for (const p of items) {
        insertPlayer.run(p.name, p.teamAbbr, p.position, p.seed);
      }
    });
    insertMany(players);
    console.log(`Seeded ${players.length} players`);
  }
}
