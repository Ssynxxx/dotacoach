const axios = require('axios');
const { AppError } = require('../utils/AppError');

const BASE = 'https://api.opendota.com/api';
const IMG = 'https://cdn.cloudflare.steamstatic.com';
const HOUR = 60 * 60 * 1000;
const cache = new Map();

async function request(path, ttl = 0) {
  const hit = cache.get(path);
  if (ttl && hit && hit.exp > Date.now()) return hit.data;
  try {
    const params = process.env.OPENDOTA_API_KEY ? { api_key: process.env.OPENDOTA_API_KEY } : undefined;
    const { data } = await axios.get(BASE + path, { timeout: 15000, params });
    if (ttl) cache.set(path, { data, exp: Date.now() + ttl });
    return data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) throw new AppError(404, 'Data tidak ditemukan di OpenDota');
    if (status === 429) throw new AppError(429, 'Limit OpenDota tercapai, coba lagi sebentar lagi');
    throw new AppError(502, 'Gagal mengambil data dari OpenDota');
  }
}

function normalizeHero(h) {
  let pick = 0;
  let win = 0;
  for (let i = 1; i <= 8; i++) {
    pick += h[`${i}_pick`] || 0;
    win += h[`${i}_win`] || 0;
  }
  return {
    id: h.id,
    name: h.name,
    localizedName: h.localized_name,
    primaryAttr: h.primary_attr,
    attackType: h.attack_type,
    roles: h.roles || [],
    img: IMG + h.img,
    icon: IMG + h.icon,
    pubPick: pick,
    pubWinRate: pick ? Math.round((win / pick) * 1000) / 10 : null,
  };
}

const getHeroes = async () => (await request('/heroStats', HOUR)).map(normalizeHero);

async function getHeroMap() {
  const map = {};
  for (const h of await getHeroes()) map[h.id] = h;
  return map;
}

const getItemMap = async () => request('/constants/item_ids', HOUR);
const getPlayer = (id) => request(`/players/${id}`);
const getWinLoss = (id) => request(`/players/${id}/wl`);
const getPlayerHeroes = (id) => request(`/players/${id}/heroes`);
const getRecentMatches = (id) => request(`/players/${id}/recentMatches`);
const getMatch = (id) => request(`/matches/${id}`);

module.exports = {
  getHeroes,
  getHeroMap,
  getItemMap,
  getPlayer,
  getWinLoss,
  getPlayerHeroes,
  getRecentMatches,
  getMatch,
  normalizeHero,
};
