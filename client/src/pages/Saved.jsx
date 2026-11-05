import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { analyses, favorites } from '../store';
import { fetchHeroes } from '../store/dotaSlice';
import Markdown from '../components/Markdown';
import { Empty, ErrorText } from '../components/Status';
import { fmtDate } from '../utils';

const TYPE = { match: 'Analisis match', draft: 'Saran draft', chat: 'Chat' };

function FavoriteItem({ fav, hero }) {
  const dispatch = useDispatch();
  const [note, setNote] = useState(fav.note || '');
  return (
    <li className="fav">
      {hero && <img src={hero.icon} alt="" />}
      <strong>{fav.heroName}</strong>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan singkat" aria-label={`Catatan ${fav.heroName}`} maxLength={200} />
      <button className="ghost" disabled={note === (fav.note || '')} onClick={() => dispatch(favorites.update({ id: fav.id, note }))}>Simpan</button>
      <button className="ghost danger" onClick={() => dispatch(favorites.remove(fav.id))}>Hapus</button>
    </li>
  );
}

export default function Saved() {
  const dispatch = useDispatch();
  const favs = useSelector((s) => s.favorites);
  const saved = useSelector((s) => s.analyses);
  const { heroes, heroesStatus } = useSelector((s) => s.dota);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (favs.status === 'idle') dispatch(favorites.fetchAll());
    if (saved.status === 'idle') dispatch(analyses.fetchAll());
    if (heroesStatus === 'idle') dispatch(fetchHeroes());
  }, [favs.status, saved.status, heroesStatus, dispatch]);

  return (
    <>
      <h1>Tersimpan</h1>

      <h2>Hero favorit</h2>
      <ErrorText>{favs.error}</ErrorText>
      {favs.items.length === 0 ? <Empty>Belum ada hero favorit. Tambahkan dari halaman Hero.</Empty> : (
        <ul className="cards">
          {favs.items.map((f) => <FavoriteItem key={f.id} fav={f} hero={heroes.find((h) => h.id === f.heroId)} />)}
        </ul>
      )}

      <h2>Hasil analisis</h2>
      <ErrorText>{saved.error}</ErrorText>
      {saved.items.length === 0 ? <Empty>Belum ada analisis tersimpan.</Empty> : (
        <ul className="cards">
          {saved.items.map((a) => (
            <li key={a.id} className="panel">
              <h3>{a.title}</h3>
              <p className="muted small">{TYPE[a.type]} · {fmtDate(a.createdAt)}</p>
              {open === a.id && <Markdown>{a.content}</Markdown>}
              <div className="row">
                <button className="ghost" onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? 'Tutup' : 'Baca'}</button>
                <button className="ghost danger" onClick={() => dispatch(analyses.remove(a.id))}>Hapus</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
