import type { DraftState, Player } from './types';

const BASE = '/api';

export async function fetchDraft(): Promise<DraftState> {
  const res = await fetch(`${BASE}/draft`);
  if (!res.ok) throw new Error('Failed to fetch draft');
  return res.json();
}

export async function searchPlayers(search: string): Promise<Player[]> {
  const res = await fetch(`${BASE}/players?available=true&search=${encodeURIComponent(search)}`);
  if (!res.ok) throw new Error('Failed to search players');
  return res.json();
}

export async function createPick(playerId: number, teamId: number, bidAmount: number) {
  const res = await fetch(`${BASE}/picks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, teamId, bidAmount }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create pick');
  }
  return res.json();
}

export async function deletePick(pickId: number) {
  const res = await fetch(`${BASE}/picks/${pickId}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete pick');
  }
  return res.json();
}

export async function updateTeam(teamId: number, data: { name?: string; budget?: number }) {
  const res = await fetch(`${BASE}/teams/${teamId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update team');
  return res.json();
}

export async function resetDraft() {
  const res = await fetch(`${BASE}/draft/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset draft');
  return res.json();
}

export async function getEmailResults(to?: string): Promise<{ mailtoUrl: string; results: string }> {
  const res = await fetch(`${BASE}/email/mailto?to=${encodeURIComponent(to || '')}`);
  if (!res.ok) throw new Error('Failed to get email results');
  return res.json();
}
