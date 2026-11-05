jest.mock('../src/services/opendota');

const request = require('supertest');
const od = require('../src/services/opendota');
const app = require('../src/app');
const { sequelize } = require('../src/models');
const { makeUser } = require('./helpers');

let auth;
beforeAll(async () => {
  await sequelize.sync({ force: true });
  ({ auth } = await makeUser());
});
afterAll(() => sequelize.close());

const get = (url) => request(app).get(url).set('Authorization', auth);

describe('/dota', () => {
  it('butuh login', async () => {
    expect((await request(app).get('/dota/heroes')).status).toBe(401);
  });

  it('daftar dan detail hero', async () => {
    od.getHeroes.mockResolvedValue([{ id: 1, localizedName: 'Anti-Mage' }]);
    expect((await get('/dota/heroes')).body).toHaveLength(1);
    expect((await get('/dota/heroes/1')).body.localizedName).toBe('Anti-Mage');
    expect((await get('/dota/heroes/999')).status).toBe(404);
  });

  it('profil player dengan hero teratas', async () => {
    od.getPlayer.mockResolvedValue({ profile: { personaname: 'Pro' }, rank_tier: 53 });
    od.getWinLoss.mockResolvedValue({ win: 10, lose: 5 });
    od.getPlayerHeroes.mockResolvedValue([{ hero_id: '1', games: 9, win: 5 }, { hero_id: '77', games: 2, win: 1 }]);
    od.getHeroMap.mockResolvedValue({ 1: { localizedName: 'Anti-Mage', icon: 'i.png' } });
    const res = await get('/dota/players/76561197960265729');
    expect(res.status).toBe(200);
    expect(res.body.rankTier).toBe(53);
    expect(res.body.topHeroes[0].hero).toBe('Anti-Mage');
    expect(res.body.topHeroes[1].hero).toBe('Hero 77');
    expect(od.getPlayer).toHaveBeenCalledWith('1');
  });

  it('profil kosong jika player private', async () => {
    od.getPlayer.mockResolvedValue({});
    od.getPlayerHeroes.mockResolvedValue([]);
    const res = await get('/dota/players/5');
    expect(res.body.profile).toBeNull();
    expect(res.body.rankTier).toBeNull();
  });

  it('400 untuk Steam ID tidak valid', async () => {
    expect((await get('/dota/players/abc')).status).toBe(400);
    expect((await get('/dota/players/abc/recent-matches')).status).toBe(400);
  });

  it('recent matches dan detail match', async () => {
    od.getRecentMatches.mockResolvedValue([{ match_id: 1 }]);
    od.getMatch.mockResolvedValue({ match_id: 123 });
    expect((await get('/dota/players/7/recent-matches')).body).toHaveLength(1);
    expect((await get('/dota/matches/123')).body.match_id).toBe(123);
    expect((await get('/dota/matches/abc')).status).toBe(400);
  });
});
