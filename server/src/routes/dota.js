const express = require('express');
const od = require('../services/opendota');
const { authenticate } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../utils/AppError');
const { toAccountId } = require('../utils/steam');

const router = express.Router();
router.use(authenticate);

const accountOf = (req) => {
  const id = toAccountId(req.params.accountId);
  if (!id) throw new AppError(400, 'Steam ID tidak valid');
  return id;
};

router.get('/heroes', asyncHandler(async (req, res) => res.json(await od.getHeroes())));

router.get(
  '/heroes/:id',
  asyncHandler(async (req, res) => {
    const hero = (await od.getHeroes()).find((h) => h.id === Number(req.params.id));
    if (!hero) throw new AppError(404, 'Hero tidak ditemukan');
    res.json(hero);
  })
);

router.get(
  '/players/:accountId',
  asyncHandler(async (req, res) => {
    const id = accountOf(req);
    const [player, winLoss, heroStats, heroMap] = await Promise.all([
      od.getPlayer(id),
      od.getWinLoss(id),
      od.getPlayerHeroes(id),
      od.getHeroMap(),
    ]);
    res.json({
      profile: player.profile || null,
      rankTier: player.rank_tier || null,
      winLoss,
      topHeroes: heroStats.slice(0, 5).map((h) => ({
        heroId: Number(h.hero_id),
        hero: heroMap[h.hero_id]?.localizedName || `Hero ${h.hero_id}`,
        icon: heroMap[h.hero_id]?.icon || null,
        games: h.games,
        win: h.win,
      })),
    });
  })
);

router.get(
  '/players/:accountId/recent-matches',
  asyncHandler(async (req, res) => res.json(await od.getRecentMatches(accountOf(req))))
);

router.get(
  '/matches/:matchId',
  asyncHandler(async (req, res) => {
    if (!/^\d+$/.test(req.params.matchId)) throw new AppError(400, 'Match ID harus berupa angka');
    res.json(await od.getMatch(req.params.matchId));
  })
);

module.exports = router;
