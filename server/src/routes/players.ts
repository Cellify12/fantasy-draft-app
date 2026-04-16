import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { available, search } = req.query;

  let sql = 'SELECT id, name, team_abbr as teamAbbr, position, seed, rank FROM players';
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (available === 'true') {
    conditions.push('id NOT IN (SELECT player_id FROM picks)');
  }

  if (search && typeof search === 'string' && search.trim()) {
    conditions.push('name LIKE ?');
    params.push(`%${search.trim()}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY rank ASC, name ASC';

  const players = db.prepare(sql).all(...params);
  res.json(players);
});

export default router;
