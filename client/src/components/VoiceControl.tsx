import { useState, useRef, useCallback, useEffect } from 'react';
import type { Player, Team } from '../types';

// Word-to-number map for speech recognition
const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

function parseSpokenNumber(text: string): number | null {
  // Try direct numeric parse first
  const directNum = text.replace(/[$,]/g, '').match(/\d+/);
  if (directNum) return parseInt(directNum[0]);

  // Parse word numbers like "thirty five" -> 35
  const words = text.toLowerCase().split(/[\s-]+/);
  let total = 0;
  let current = 0;

  for (const word of words) {
    const num = WORD_NUMBERS[word];
    if (num === undefined) continue;
    if (num === 100) {
      current = (current || 1) * 100;
    } else if (num >= 20) {
      current += num;
    } else {
      current += num;
    }
  }
  total += current;
  return total > 0 ? total : null;
}

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9' ]/g, '')
    .trim();
}

function fuzzyMatch(needle: string, haystack: string): boolean {
  const n = normalize(needle);
  const h = normalize(haystack);
  // Check if all words in needle appear in haystack
  const needleWords = n.split(/\s+/);
  return needleWords.every(w => h.includes(w));
}

interface ParsedCommand {
  player: Player | null;
  team: Team | null;
  amount: number | null;
  playerCandidates?: Player[];
}

function parseVoiceCommand(
  transcript: string,
  players: Player[],
  teams: Team[]
): ParsedCommand {
  const text = transcript.toLowerCase();

  // Extract amount — look for "for <number>" or just a number at the end
  let amountText = '';
  const forMatch = text.match(/for\s+(.+?)(?:\s+dollars?)?$/);
  if (forMatch) {
    amountText = forMatch[1];
  } else {
    const endMatch = text.match(/(\d+)\s*(?:dollars?)?$/);
    if (endMatch) amountText = endMatch[1];
  }
  const amount = amountText ? parseSpokenNumber(amountText) : null;

  // Remove the amount portion from text for player/team matching
  let searchText = text;
  if (forMatch) {
    searchText = text.slice(0, text.indexOf(forMatch[0]));
  } else if (amount) {
    searchText = text.replace(/\d+\s*(?:dollars?)?\s*$/, '');
  }

  // Split on "sold to" or "to" to get player and team portions
  let playerText = '';
  let teamText = '';

  const soldToMatch = searchText.match(/(.+?)\s+sold\s+to\s+(.+)/);
  const toMatch = searchText.match(/(.+?)\s+to\s+(.+)/);

  if (soldToMatch) {
    playerText = soldToMatch[1].trim();
    teamText = soldToMatch[2].trim();
  } else if (toMatch) {
    playerText = toMatch[1].trim();
    teamText = toMatch[2].trim();
  } else {
    playerText = searchText.trim();
  }

  // Match player — find best fuzzy matches
  let player: Player | null = null;
  let playerCandidates: Player[] = [];

  if (playerText) {
    // Try exact-ish match first
    const exactMatches = players.filter(p => normalize(p.name) === normalize(playerText));
    if (exactMatches.length === 1) {
      player = exactMatches[0];
    } else {
      // Fuzzy match
      playerCandidates = players.filter(p => fuzzyMatch(playerText, p.name));
      if (playerCandidates.length === 1) {
        player = playerCandidates[0];
        playerCandidates = [];
      } else if (playerCandidates.length === 0) {
        // Try partial match on last name
        const lastWord = playerText.split(/\s+/).pop() ?? '';
        playerCandidates = players.filter(p => {
          const lastName = p.name.split(/\s+/).pop() ?? '';
          return normalize(lastName).includes(normalize(lastWord));
        });
        if (playerCandidates.length === 1) {
          player = playerCandidates[0];
          playerCandidates = [];
        }
      }
    }
  }

  // Match team
  let team: Team | null = null;
  if (teamText) {
    const normalizedTeam = normalize(teamText);
    // Try exact match
    team = teams.find(t => normalize(t.name) === normalizedTeam) ?? null;
    // Try partial match
    if (!team) {
      team = teams.find(t => normalize(t.name).includes(normalizedTeam)) ?? null;
    }
    if (!team) {
      team = teams.find(t => normalizedTeam.includes(normalize(t.name))) ?? null;
    }
  }

  return { player, team, amount, playerCandidates: playerCandidates.length > 0 ? playerCandidates.slice(0, 5) : undefined };
}

// Check for SpeechRecognition support
const SpeechRecognition = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

interface VoiceControlProps {
  players: Player[];
  teams: Team[];
  onConfirm: (playerId: number, teamId: number, bidAmount: number) => void;
}

export default function VoiceControl({ players, teams, onConfirm }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      if (currentTranscript) {
        setTranscript(currentTranscript);
        if (finalTranscript) {
          const result = parseVoiceCommand(finalTranscript, players, teams);
          setParsed(result);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        setError(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Restart if still supposed to be listening
      if (recognitionRef.current) {
        try { recognition.start(); } catch { /* already started */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setError(null);
    setTranscript('');
    setParsed(null);
  }, [players, teams]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.stop();
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  function handleConfirm() {
    if (!parsed?.player || !parsed?.team || !parsed?.amount) return;
    onConfirm(parsed.player.id, parsed.team.id, parsed.amount);
    setTranscript('');
    setParsed(null);
  }

  function handleClear() {
    setTranscript('');
    setParsed(null);
  }

  function selectCandidate(player: Player) {
    if (parsed) {
      setParsed({ ...parsed, player, playerCandidates: undefined });
    }
  }

  if (!SpeechRecognition) {
    return null; // Don't show voice control if unsupported
  }

  const hasContent = isListening || transcript || parsed || error;

  // Inline button only — no wrapper div
  if (!hasContent) {
    return (
      <button
        onClick={startListening}
        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-3 rounded transition-colors"
        title="Voice draft: say 'Player sold to Team for Amount'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
        Voice
      </button>
    );
  }

  // Expanded voice panel — shown as a floating overlay below the control bar
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 w-[500px] max-w-[90vw]">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            isListening
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
          {isListening ? 'Listening...' : 'Start'}
        </button>
        <button
          onClick={() => { stopListening(); handleClear(); }}
          className="text-slate-400 hover:text-white text-sm"
        >
          Close
        </button>
      </div>

      {isListening && !transcript && (
        <p className="text-xs text-slate-500">
          Say: "Player name sold to team name for amount"
        </p>
      )}

      {error && <div className="text-red-400 text-sm">{error}</div>}

      {transcript && (
        <div className="bg-slate-900 rounded px-3 py-2 mb-2">
          <span className="text-xs text-slate-500">Heard: </span>
          <span className="text-white text-sm">"{transcript}"</span>
        </div>
      )}

      {parsed && (
        <div className="bg-slate-900 rounded px-3 py-2 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Player:</span>
            {parsed.player ? (
              <span className="text-white font-medium">
                {parsed.player.name}
                <span className="text-slate-400 text-xs ml-1">({parsed.player.position}, {parsed.player.teamAbbr})</span>
              </span>
            ) : parsed.playerCandidates ? (
              <div className="flex flex-wrap gap-1">
                {parsed.playerCandidates.map(p => (
                  <button key={p.id} onClick={() => selectCandidate(p)}
                    className="px-2 py-0.5 bg-slate-700 hover:bg-blue-600 rounded text-xs text-white transition-colors"
                  >{p.name}</button>
                ))}
              </div>
            ) : <span className="text-red-400">Not found</span>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Team:</span>
            {parsed.team ? <span className="text-blue-400 font-medium">{parsed.team.name}</span> : <span className="text-red-400">Not found</span>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Amount:</span>
            {parsed.amount ? <span className="text-emerald-400 font-mono">${parsed.amount}</span> : <span className="text-red-400">Not found</span>}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleConfirm} disabled={!parsed.player || !parsed.team || !parsed.amount}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-1.5 px-3 rounded text-sm transition-colors"
            >Confirm Draft</button>
            <button onClick={handleClear}
              className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded text-sm transition-colors"
            >Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
