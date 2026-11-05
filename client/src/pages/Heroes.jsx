import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHeroes } from '../store/dotaSlice';
import { favorites } from '../store';
import { Empty, ErrorText, Loading } from '../components/Status';
import { ATTRS, ROLES } from '../utils';

export default function Heroes() {
  const dispatch = useDispatch();
  const { heroes, heroesStatus, error } = useSelector((s) => s.dota);
  const favs = useSelector((s) => s.favorites);
  const [q, setQ] = useState('');
  const [attr, setAttr] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    if (heroesStatus === 'idle') dispatch(fetchHeroes());
    if (favs.status === 'idle') dispatch(favorites.fetchAll());
  }, [heroesStatus, favs.status, dispatch]);

  const favByHero = useMemo(() => Object.fromEntries(favs.items.map((f) => [f.heroId, f])), [favs.items]);
  const list = useMemo(
    () =>
      heroes
        .filter((h) => h.localizedName.toLowerCase().includes(q.toLowerCase()))
        .filter((h) => !attr || h.primaryAttr === attr)
        .filter((h) => !role || h.roles.includes(role))
        .sort((a, b) => a.localizedName.localeCompare(b.localizedName)),
    [heroes, q, attr, role]
  );

  const toggle = (h) => {
    const fav = favByHero[h.id];
    dispatch(fav ? favorites.remove(fav.id) : favorites.create({ heroId: h.id, heroName: h.localizedName }));
  };

  return (
    <>
      <h1>Hero</h1>
      <div className="row filters">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari hero..." aria-label="Cari hero" />
        <select value={attr} onChange={(e) => setAttr(e.target.value)} aria-label="Atribut utama">
          <option value="">Semua atribut</option>
          {Object.entries(ATTRS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="">Semua role</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      {heroesStatus === 'loading' && <Loading text="Memuat daftar hero..." />}
      <ErrorText>{heroesStatus === 'error' ? error : favs.error}</ErrorText>
      {heroesStatus === 'ready' && list.length === 0 && <Empty>Tidak ada hero yang cocok dengan filter.</Empty>}
      <div className="grid">
        {list.map((h) => (
          <article key={h.id} className="hero-card">
            <img src={h.img} alt={h.localizedName} loading="lazy" />
            <div className="hero-info">
              <h3>{h.localizedName}</h3>
              <p className="muted small">{ATTRS[h.primaryAttr]} · {h.attackType}</p>
              <p className="small">Win rate publik: <strong>{h.pubWinRate ?? '-'}%</strong></p>
              <button className={favByHero[h.id] ? 'ghost active' : 'ghost'} onClick={() => toggle(h)} aria-pressed={!!favByHero[h.id]}>
                {favByHero[h.id] ? 'Hapus favorit' : 'Tambah favorit'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
