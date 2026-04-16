import { Router } from 'express';
import db from '../db.js';

const ROSTER_SIZE = 9;

const router = Router();

// Generate draft results as formatted text
function generateDraftResults(): string {
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
  `).all() as Array<{
    id: number; playerId: number; teamId: number; bidAmount: number;
    pickOrder: number; playerName: string; playerTeamAbbr: string; playerPosition: string;
  }>;

  let text = '🏀 NBA PLAYOFF DRAFT 2026 — FINAL RESULTS\n';
  text += '='.repeat(50) + '\n\n';

  for (const team of teams) {
    const teamPicks = picks.filter(p => p.teamId === team.id);
    const remaining = team.budget - team.spent;

    text += `📋 ${team.name}\n`;
    text += `-`.repeat(40) + '\n';
    text += `Budget: $${team.budget} | Spent: $${team.spent} | Remaining: $${remaining}\n`;
    text += `Players: ${teamPicks.length}/${ROSTER_SIZE}\n\n`;

    if (teamPicks.length === 0) {
      text += '  (No picks)\n';
    } else {
      for (const pick of teamPicks) {
        text += `  #${pick.pickOrder}  ${pick.playerName} (${pick.playerPosition}, ${pick.playerTeamAbbr}) — $${pick.bidAmount}\n`;
      }
    }
    text += '\n';
  }

  text += '='.repeat(50) + '\n';
  text += `Total picks: ${picks.length}\n`;
  text += `Generated: ${new Date().toLocaleString()}\n`;

  return text;
}

// Get draft results as text (for preview)
router.get('/preview', (_req, res) => {
  const results = generateDraftResults();
  res.json({ results });
});

// Send draft results via mailto link (client-side email)
router.get('/mailto', (req, res) => {
  const { to } = req.query;
  const results = generateDraftResults();
  const subject = 'NBA Playoff Draft 2026 — Final Results';

  const mailtoUrl = `mailto:${to || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(results)}`;

  res.json({ mailtoUrl, results });
});

export default router;
