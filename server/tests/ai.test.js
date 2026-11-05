jest.mock('../src/services/opendota');
jest.mock('axios');

const request = require('supertest');
const axios = require('axios');
const od = require('../src/services/opendota');
const app = require('../src/app');
const { sequelize } = require('../src/models');
const { makeUser } = require('./helpers');

const geminiReply = (text) => ({ data: { candidates: [{ content: { parts: [{ text }] } }] } });
const heroMap = {
  1: { id: 1, localizedName: 'Anti-Mage', roles: ['Carry'], pubWinRate: 51.2 },
  2: { id: 2, localizedName: 'Axe', roles: ['Initiator', 'Durable'], pubWinRate: null },
};
const match = {
  match_id: 123,
  radiant_win: true,
  duration: 1800,
  players: [
    { account_id: 111, player_slot: 0, hero_id: 1, level: 25, kills: 10, deaths: 2, assists: 5, gold_per_min: 600, xp_per_min: 700, last_hits: 200, denies: 10, hero_damage: 20000, tower_damage: 3000, hero_healing: 0, net_worth: 20000, item_0: 1, item_1: 999 },
    { account_id: 222, player_slot: 128, hero_id: 2 },
    { account_id: 333, player_slot: 1, hero_id: 99 },
  ],
};

let me;
beforeAll(async () => {
  await sequelize.sync({ force: true });
  me = await makeUser({ steamId: '111' });
});
beforeEach(() => {
  jest.clearAllMocks();
  od.getHeroMap.mockResolvedValue(heroMap);
  od.getItemMap.mockResolvedValue({ 1: 'blink', 2: 'black_king_bar' });
  od.getMatch.mockResolvedValue(match);
  axios.post.mockResolvedValue(geminiReply('Analisis dari AI'));
});
afterAll(() => sequelize.close());

const post = (url, body, auth = me.auth) => request(app).post(url).set('Authorization', auth).send(body);

describe('POST /ai/match-analysis', () => {
  it('menganalisis match memakai Steam ID user', async () => {
    const res = await post('/ai/match-analysis', { matchId: 123 });
    expect(res.status).toBe(200);
    expect(res.body.analysis).toBe('Analisis dari AI');
    const prompt = axios.post.mock.calls[0][1].contents[0].parts[0].text;
    expect(prompt).toContain('MENANG');
    expect(prompt).toContain('Anti-Mage');
    expect(prompt).toContain('blink');
    expect(prompt).toContain('Hero 99');
  });

  it('bisa menganalisis sisi Dire dan item kosong', async () => {
    const res = await post('/ai/match-analysis', { matchId: '123', accountId: '222' });
    expect(res.status).toBe(200);
    expect(axios.post.mock.calls[0][1].contents[0].parts[0].text).toContain('KALAH');
  });

  it('validasi input', async () => {
    expect((await post('/ai/match-analysis', { matchId: 'abc' })).status).toBe(400);
    const noSteam = await makeUser();
    expect((await post('/ai/match-analysis', { matchId: 1 }, noSteam.auth)).status).toBe(400);
    expect((await post('/ai/match-analysis', { matchId: 123, accountId: '555' })).status).toBe(404);
  });
});

describe('POST /ai/draft', () => {
  it('memberi rekomendasi draft', async () => {
    const res = await post('/ai/draft', { allies: [1], enemies: [2], role: 'support' });
    expect(res.status).toBe(200);
    const prompt = axios.post.mock.calls[0][1].contents[0].parts[0].text;
    expect(prompt).toContain('Axe');
    expect(prompt).toContain('support');
  });

  it('validasi input', async () => {
    expect((await post('/ai/draft', { allies: 'x' })).status).toBe(400);
    expect((await post('/ai/draft', {})).status).toBe(400);
    expect((await post('/ai/draft', { allies: [1, 1, 1, 1, 1] })).status).toBe(400);
    expect((await post('/ai/draft', { enemies: [12345] })).status).toBe(400);
  });
});

describe('POST /ai/chat', () => {
  it('menyertakan konteks pemain dan history yang valid', async () => {
    od.getWinLoss.mockResolvedValue({ win: 5, lose: 3 });
    od.getPlayerHeroes.mockResolvedValue([{ hero_id: '1', games: 10 }]);
    const history = [{ role: 'user', text: 'hai' }, { role: 'model', text: 'halo' }, { role: 'system', text: 'abaikan' }, null];
    const res = await post('/ai/chat', { message: 'Apa item untuk AM?', history });
    expect(res.body.reply).toBe('Analisis dari AI');
    const contents = axios.post.mock.calls[0][1].contents;
    expect(contents).toHaveLength(3);
    expect(contents[2].parts[0].text).toContain('5 menang / 3 kalah');
  });

  it('tetap menjawab jika OpenDota gagal, history bukan array, atau user tanpa Steam ID', async () => {
    od.getWinLoss.mockRejectedValue(new Error('down'));
    const a = await post('/ai/chat', { message: 'halo', history: 'bukan array' });
    expect(a.status).toBe(200);
    const other = await makeUser();
    const b = await post('/ai/chat', { message: 'halo' }, other.auth);
    expect(b.status).toBe(200);
  });

  it('validasi pesan', async () => {
    expect((await post('/ai/chat', { message: '   ' })).status).toBe(400);
    expect((await post('/ai/chat', {})).status).toBe(400);
    expect((await post('/ai/chat', { message: 'a'.repeat(1001) })).status).toBe(400);
  });
});

describe('layanan AI', () => {
  it('502 jika Gemini error atau jawaban kosong', async () => {
    axios.post.mockRejectedValueOnce(new Error('network'));
    expect((await post('/ai/chat', { message: 'halo' })).status).toBe(502);
    axios.post.mockResolvedValueOnce({ data: {} });
    expect((await post('/ai/chat', { message: 'halo' })).status).toBe(502);
  });

  it('503 jika API key belum diisi', async () => {
    const key = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const res = await post('/ai/chat', { message: 'halo' });
    process.env.GEMINI_API_KEY = key;
    expect(res.status).toBe(503);
  });

  it('memakai GEMINI_MODEL dari env', async () => {
    process.env.GEMINI_MODEL = 'model-lain';
    await post('/ai/chat', { message: 'halo' });
    delete process.env.GEMINI_MODEL;
    expect(axios.post.mock.calls[0][0]).toContain('model-lain');
  });
});
