import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Combined endpoint — one request gets everything the UI needs
router.get('/', (_req, res) => {
  const teams = db.prepare(`
    SELECT t.id, t.name, t.budget,
      COALESCE(SUM(p.bid_amount), 0) as spent
    FROM teams t
    LEFT JOIN picks p ON p.team_id = t.id
    GROUP BY t.id
    ORDER BY t.id
  `).all() as Array<{ id: number; name: string; budget: number; spent: number }>;

  const picks = db.prepare(`
    SELECT p.id, p.player_id as playerId, p.team_id as teamId,
      p.bid_amount as bidAmount, p.pick_order as pickOrder,
      pl.name as playerName, pl.team_abbr as playerTeamAbbr, pl.position as playerPosition
    FROM picks p
    JOIN players pl ON pl.id = p.player_id
    ORDER BY p.pick_order ASC
  `).all();

  const availablePlayers = db.prepare(`
    SELECT id, name, team_abbr as teamAbbr, position, seed
    FROM players
    WHERE id NOT IN (SELECT player_id FROM picks)
    ORDER BY seed ASC, team_abbr ASC, name ASC
  `).all();

  res.json({
    teams: teams.map(t => ({
      ...t,
      remaining: t.budget - t.spent,
      picks: picks.filter((p: any) => p.teamId === t.id),
    })),
    picks,
    availablePlayers,
  });
});

// Reset draft — delete all picks
router.post('/reset', (_req, res) => {
  db.prepare('DELETE FROM picks').run();
  res.json({ success: true });
});

export default router;
