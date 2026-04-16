import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const teams = db.prepare(`
    SELECT t.id, t.name, t.budget,
      COALESCE(SUM(p.bid_amount), 0) as spent
    FROM teams t
    LEFT JOIN picks p ON p.team_id = t.id
    GROUP BY t.id
    ORDER BY t.id
  `).all() as Array<{ id: number; name: string; budget: number; spent: number }>;

  res.json(teams.map(t => ({
    ...t,
    remaining: t.budget - t.spent,
  })));
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, budget } = req.body;

  if (name !== undefined) {
    db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(name, id);
  }
  if (budget !== undefined) {
    db.prepare('UPDATE teams SET budget = ? WHERE id = ?').run(budget, id);
  }

  res.json({ success: true });
});

export default router;
