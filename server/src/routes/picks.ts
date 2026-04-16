import { Router } from 'express';
import db from '../db.js';

const ROSTER_SIZE = 9;

const router = Router();

router.get('/', (_req, res) => {
  const picks = db.prepare(`
    SELECT p.id, p.player_id as playerId, p.team_id as teamId,
      p.bid_amount as bidAmount, p.pick_order as pickOrder,
      pl.name as playerName, pl.team_abbr as playerTeamAbbr, pl.position as playerPosition
    FROM picks p
    JOIN players pl ON pl.id = p.player_id
    ORDER BY p.pick_order ASC
  `).all();
  res.json(picks);
});

router.post('/', (req, res) => {
  const { playerId, teamId, bidAmount } = req.body;

  if (!playerId || !teamId || !bidAmount || bidAmount <= 0) {
    res.status(400).json({ error: 'playerId, teamId, and bidAmount (> 0) are required' });
    return;
  }

  // Check player not already drafted
  const existing = db.prepare('SELECT id FROM picks WHERE player_id = ?').get(playerId);
  if (existing) {
    res.status(400).json({ error: 'Player already drafted' });
    return;
  }

  // Check roster limit
  const rosterCount = db.prepare('SELECT COUNT(*) as count FROM picks WHERE team_id = ?').get(teamId) as { count: number };
  if (rosterCount.count >= ROSTER_SIZE) {
    res.status(400).json({ error: `Roster full (${ROSTER_SIZE}/${ROSTER_SIZE}). Cannot add more players.` });
    return;
  }

  // Check team budget
  const team = db.prepare(`
    SELECT t.budget, COALESCE(SUM(p.bid_amount), 0) as spent
    FROM teams t
    LEFT JOIN picks p ON p.team_id = t.id
    WHERE t.id = ?
    GROUP BY t.id
  `).get(teamId) as { budget: number; spent: number } | undefined;

  if (!team) {
    res.status(400).json({ error: 'Team not found' });
    return;
  }

  if (team.budget - team.spent < bidAmount) {
    res.status(400).json({ error: `Insufficient budget. Remaining: $${team.budget - team.spent}` });
    return;
  }

  // Get next pick order
  const last = db.prepare('SELECT MAX(pick_order) as maxOrder FROM picks').get() as { maxOrder: number | null };
  const pickOrder = (last.maxOrder ?? 0) + 1;

  const result = db.prepare(
    'INSERT INTO picks (player_id, team_id, bid_amount, pick_order) VALUES (?, ?, ?, ?)'
  ).run(playerId, teamId, bidAmount, pickOrder);

  const pick = db.prepare(`
    SELECT p.id, p.player_id as playerId, p.team_id as teamId,
      p.bid_amount as bidAmount, p.pick_order as pickOrder,
      pl.name as playerName, pl.team_abbr as playerTeamAbbr, pl.position as playerPosition
    FROM picks p
    JOIN players pl ON pl.id = p.player_id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(pick);
});

// Delete ANY pick (not just the last one)
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const pick = db.prepare('SELECT id FROM picks WHERE id = ?').get(Number(id));
  if (!pick) {
    res.status(404).json({ error: 'Pick not found' });
    return;
  }

  db.prepare('DELETE FROM picks WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
