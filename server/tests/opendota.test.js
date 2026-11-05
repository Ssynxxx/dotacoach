jest.mock('axios');
const axios = require('axios');
const od = require('../src/services/opendota');

const rawHero = { id: 1, name: 'npc_dota_hero_antimage', localized_name: 'Anti-Mage', primary_attr: 'agi', attack_type: 'Melee', roles: ['Carry'], img: '/a.png', icon: '/b.png', '1_pick': 10, '1_win': 6, '2_pick': 10, '2_win': 4 };

beforeEach(() => jest.clearAllMocks());

describe('opendota service', () => {
  it('menormalisasi hero, menghitung win rate, dan memakai cache', async () => {
    axios.get.mockResolvedValue({ data: [rawHero, { id: 2, localized_name: 'Axe', img: '/x', icon: '/y' }] });
    const heroes = await od.getHeroes();
    expect(heroes[0]).toMatchObject({ id: 1, localizedName: 'Anti-Mage', pubWinRate: 50, pubPick: 20 });
    expect(heroes[1]).toMatchObject({ pubWinRate: null, roles: [] });
    const map = await od.getHeroMap();
    expect(map[2].localizedName).toBe('Axe');
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('item map di-cache dan mengirim api_key jika ada', async () => {
    process.env.OPENDOTA_API_KEY = 'k';
    axios.get.mockResolvedValue({ data: { 1: 'blink' } });
    expect(await od.getItemMap()).toEqual({ 1: 'blink' });
    await od.getItemMap();
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get.mock.calls[0][1].params).toEqual({ api_key: 'k' });
    delete process.env.OPENDOTA_API_KEY;
  });

  it('endpoint player dan match memanggil path yang benar', async () => {
    axios.get.mockResolvedValue({ data: {} });
    await Promise.all([od.getPlayer(1), od.getWinLoss(1), od.getPlayerHeroes(1), od.getRecentMatches(1), od.getMatch(9)]);
    const urls = axios.get.mock.calls.map((c) => c[0].replace('https://api.opendota.com/api', ''));
    expect(urls).toEqual(['/players/1', '/players/1/wl', '/players/1/heroes', '/players/1/recentMatches', '/matches/9']);
  });

  it.each([
    [404, 404],
    [429, 429],
    [500, 502],
    [undefined, 502],
  ])('status %s dipetakan ke %s', async (from, to) => {
    axios.get.mockRejectedValue(from ? { response: { status: from } } : new Error('timeout'));
    await expect(od.getMatch(1)).rejects.toMatchObject({ status: to });
  });
});
