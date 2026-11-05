const MEDALS = ['Uncalibrated', 'Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];

export function rankName(tier) {
  if (!tier) return 'Belum ada rank';
  const medal = MEDALS[Math.floor(tier / 10)] || 'Unknown';
  const star = tier % 10;
  return star && medal !== 'Immortal' ? `${medal} ${star}` : medal;
}

export const isWin = (m) => (m.player_slot < 128) === m.radiant_win;

export const fmtDuration = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export const fmtDate = (v) => new Date(typeof v === 'number' ? v * 1000 : v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export const winRate = (win, lose) => (win + lose ? ((win / (win + lose)) * 100).toFixed(1) : '0.0');

export const ATTRS = { str: 'Strength', agi: 'Agility', int: 'Intelligence', all: 'Universal' };
export const ROLES = ['Carry', 'Support', 'Nuker', 'Disabler', 'Jungler', 'Durable', 'Escape', 'Pusher', 'Initiator'];
