import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHeroes } from '../store/dotaSlice';
import { getDraftAdvice } from '../store/aiSlice';
import { analyses } from '../store';
import HeroPicker from '../components/HeroPicker';
import Markdown from '../components/Markdown';
import { ErrorText, Loading } from '../components/Status';

const POSITIONS = ['Carry (pos 1)', 'Mid (pos 2)', 'Offlane (pos 3)', 'Soft support (pos 4)', 'Hard support (pos 5)'];

export default function Draft() {
  const dispatch = useDispatch();
  const { heroes, heroesStatus } = useSelector((s) => s.dota);
  const draft = useSelector((s) => s.ai.draft);
  const saveError = useSelector((s) => s.analyses.error);
  const [allies, setAllies] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [role, setRole] = useState(POSITIONS[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (heroesStatus === 'idle') dispatch(fetchHeroes());
  }, [heroesStatus, dispatch]);

  const names = (ids) => ids.map((id) => heroes.find((h) => h.id === id)?.localizedName).join(', ');
  const submit = () => {
    setSaved(false);
    dispatch(getDraftAdvice({ allies, enemies, role }));
  };
  const save = () => {
    dispatch(analyses.create({ type: 'draft', title: `Draft vs ${names(enemies) || 'lawan'}`, content: draft.text, meta: { allies, enemies, role } }));
    setSaved(true);
  };

  if (heroesStatus === 'loading' || heroesStatus === 'idle') return <Loading text="Memuat hero..." />;

  return (
    <>
      <h1>Draft coach</h1>
      <div className="split even">
        <HeroPicker label="Hero timmu" heroes={heroes} selected={allies} max={4} onChange={setAllies} />
        <HeroPicker label="Hero lawan" heroes={heroes} selected={enemies} max={5} onChange={setEnemies} />
      </div>
      <div className="row">
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Posisi">
          {POSITIONS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button className="primary" onClick={submit} disabled={draft.status === 'loading' || (!allies.length && !enemies.length)}>
          {draft.status === 'loading' ? 'Meminta saran...' : 'Minta saran pick'}
        </button>
      </div>
      <ErrorText>{draft.status === 'error' ? draft.error : saveError}</ErrorText>
      {draft.status === 'ready' && (
        <section className="panel">
          <Markdown>{draft.text}</Markdown>
          <button className="ghost" disabled={saved} onClick={save}>{saved ? 'Tersimpan' : 'Simpan saran'}</button>
        </section>
      )}
    </>
  );
}
