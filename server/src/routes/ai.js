const express = require('express');
const od = require('../services/opendota');
const ai = require('../services/ai');
const { authenticate } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../utils/AppError');
const { toAccountId } = require('../utils/steam');

const router = express.Router();
router.use(authenticate);

router.post(
  '/match-analysis',
  asyncHandler(async (req, res) => {
    const { matchId } = req.body;
    if (!/^\d+$/.test(String(matchId ?? ''))) throw new AppError(400, 'Match ID harus berupa angka');
    const accountId = toAccountId(req.body.accountId || req.user.steamId);
    if (!accountId) throw new AppError(400, 'Isi Steam ID kamu terlebih dahulu di Dashboard');

    const [match, heroMap, itemMap] = await Promise.all([od.getMatch(matchId), od.getHeroMap(), od.getItemMap()]);
    const summary = ai.describeMatch(match, accountId, heroMap, itemMap);
    const analysis = await ai.generate([{ role: 'user', text: ai.matchPrompt(summary) }]);
    res.json({ matchId: String(matchId), analysis });
  })
);

router.post(
  '/draft',
  asyncHandler(async (req, res) => {
    const { allies = [], enemies = [], role } = req.body;
    if (!Array.isArray(allies) || !Array.isArray(enemies)) throw new AppError(400, 'allies dan enemies harus berupa array');
    if (allies.length > 4 || enemies.length > 5) throw new AppError(400, 'Maksimal 4 hero sekutu dan 5 hero lawan');
    if (!allies.length && !enemies.length) throw new AppError(400, 'Pilih minimal satu hero sekutu atau lawan');

    const heroMap = await od.getHeroMap();
    const pick = (ids) =>
      ids.map((id) => {
        if (!heroMap[id]) throw new AppError(400, `Hero dengan ID ${id} tidak dikenal`);
        return heroMap[id];
      });
    const analysis = await ai.generate([
      { role: 'user', text: ai.draftPrompt({ allies: pick(allies), enemies: pick(enemies), role }) },
    ]);
    res.json({ analysis });
  })
);

router.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const { message, history = [] } = req.body;
    if (typeof message !== 'string' || !message.trim()) throw new AppError(400, 'Pesan tidak boleh kosong');
    if (message.length > 1000) throw new AppError(400, 'Pesan maksimal 1000 karakter');

    const past = (Array.isArray(history) ? history : [])
      .filter((m) => m && ['user', 'model'].includes(m.role) && typeof m.text === 'string')
      .slice(-10)
      .map((m) => ({ role: m.role, text: m.text }));

    let context = '';
    if (req.user.steamId) {
      try {
        const [wl, heroes, heroMap] = await Promise.all([
          od.getWinLoss(req.user.steamId),
          od.getPlayerHeroes(req.user.steamId),
          od.getHeroMap(),
        ]);
        const top = heroes.slice(0, 3).map((h) => `${heroMap[h.hero_id]?.localizedName || h.hero_id} (${h.games} game)`);
        context = `[Konteks pemain: ${wl.win} menang / ${wl.lose} kalah. Hero tersering: ${top.join(', ') || '-'}]\n`;
      } catch {
        context = '';
      }
    }

    const reply = await ai.generate([...past, { role: 'user', text: context + message.trim() }]);
    res.json({ reply });
  })
);

module.exports = router;
