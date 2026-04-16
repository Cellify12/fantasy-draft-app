import { Router } from 'express';
import db from '../db.js';

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

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Only allow deleting the most recent pick
  const lastPick = db.prepare('SELECT id FROM picks ORDER BY pick_order DESC LIMIT 1').get() as { id: number } | undefined;

  if (!lastPick || lastPick.id !== Number(id)) {
    res.status(400).json({ error: 'Can only undo the most recent pick' });
    return;
  }

  db.prepare('DELETE FROM picks WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
