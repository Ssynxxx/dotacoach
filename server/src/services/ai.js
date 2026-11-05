const axios = require('axios');
const { AppError } = require('../utils/AppError');

const SYSTEM_PROMPT = `Kamu adalah coach Dota 2 berpengalaman yang menjelaskan dalam Bahasa Indonesia yang santai tapi jelas.
Aturan: gunakan HANYA data yang diberikan, jangan mengarang statistik, dan jika data tidak tersedia katakan terus terang.
Jawab dalam Markdown ringkas (maksimal sekitar 350 kata) dengan poin-poin yang bisa langsung dipraktikkan.`;

// messages: [{ role: 'user' | 'model', text }]
async function generate(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new AppError(503, 'Layanan AI belum dikonfigurasi');
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  try {
    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
        ],
        max_tokens: 8192,
      },
      { headers: { Authorization: `Bearer ${key}` }, timeout: 30000 }
    );
    const text = (data?.choices?.[0]?.message?.content || '').trim();
    if (!text) throw new AppError(502, 'AI tidak mengembalikan jawaban, coba lagi');
    return text;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('AI error:', err.response?.status, JSON.stringify(err.response?.data) || err.message);
    throw new AppError(502, 'Gagal menghubungi layanan AI');
  }
}

const itemName = (map, id) => (map[id] ? map[id].replace(/_/g, ' ') : null);

function describeMatch(match, accountId, heroMap, itemMap) {
  const p = (match.players || []).find((x) => String(x.account_id) === String(accountId));
  if (!p) throw new AppError(404, 'Pemain tidak ditemukan di match ini. Pastikan Steam ID kamu sesuai.');

  const radiant = p.player_slot < 128;
  const won = radiant === match.radiant_win;
  const hero = (id) => heroMap[id]?.localizedName || `Hero ${id}`;
  const items = [0, 1, 2, 3, 4, 5].map((i) => itemName(itemMap, p[`item_${i}`])).filter(Boolean);
  const side = (isRadiant) =>
    match.players
      .filter((x) => x.player_slot < 128 === isRadiant && x !== p)
      .map((x) => hero(x.hero_id))
      .join(', ');

  return [
    `Match ID: ${match.match_id}`,
    `Hasil: ${won ? 'MENANG' : 'KALAH'} sebagai ${radiant ? 'Radiant' : 'Dire'}, durasi ${Math.floor(match.duration / 60)} menit`,
    `Hero pemain: ${hero(p.hero_id)} (level ${p.level})`,
    `KDA: ${p.kills}/${p.deaths}/${p.assists}`,
    `GPM/XPM: ${p.gold_per_min}/${p.xp_per_min}, net worth ${p.net_worth ?? 'n/a'}`,
    `Last hit/deny: ${p.last_hits}/${p.denies}`,
    `Hero damage: ${p.hero_damage}, tower damage: ${p.tower_damage}, healing: ${p.hero_healing}`,
    `Item akhir: ${items.join(', ') || 'tidak ada data'}`,
    `Skor tim: Radiant ${match.radiant_score ?? '?'} - Dire ${match.dire_score ?? '?'}`,
    `Rekan tim: ${side(radiant) || '-'}`,
    `Lawan: ${side(!radiant) || '-'}`,
  ].join('\n');
}

function matchPrompt(summary) {
  return `Analisis performa pemain pada match Dota 2 berikut.\n\n${summary}\n\nBerikan: (1) ringkasan singkat kenapa menang/kalah, (2) 2-3 hal yang sudah bagus, (3) 3 saran perbaikan konkret, (4) saran item atau timing jika relevan.`;
}

function draftPrompt({ allies, enemies, role }) {
  const fmt = (list) =>
    list.length ? list.map((h) => `${h.localizedName} (win rate publik ${h.pubWinRate ?? 'n/a'}%, role: ${h.roles.join('/')})`).join('; ') : '-';
  return `Bantu draft Dota 2.\nTim sendiri: ${fmt(allies)}\nLawan: ${fmt(enemies)}\nPosisi yang dicari: ${role || 'bebas'}\n\nRekomendasikan 3 hero untuk di-pick, masing-masing dengan alasan synergy/counter, item inti, dan hal yang perlu diwaspadai.`;
}

module.exports = { generate, describeMatch, matchPrompt, draftPrompt, SYSTEM_PROMPT };
