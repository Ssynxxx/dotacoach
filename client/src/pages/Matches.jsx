import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHeroes, fetchRecentMatches } from '../store/dotaSlice';
import { analyzeMatch } from '../store/aiSlice';
import { analyses } from '../store';
import Markdown from '../components/Markdown';
import { Empty, ErrorText, Loading } from '../components/Status';
import { fmtDate, fmtDuration, isWin } from '../utils';

export default function Matches() {
  const dispatch = useDispatch();
  const steamId = useSelector((s) => s.auth.user.steamId);
  const { heroes, heroesStatus, matches, matchesStatus, error } = useSelector((s) => s.dota);
  const result = useSelector((s) => s.ai.match);
  const saved = useSelector((s) => s.analyses);

  useEffect(() => {
    if (heroesStatus === 'idle') dispatch(fetchHeroes());
    if (saved.status === 'idle') dispatch(analyses.fetchAll());
    if (steamId) dispatch(fetchRecentMatches(steamId));
  }, [steamId, heroesStatus, saved.status, dispatch]);

  if (!steamId) return <><h1>Analisis match</h1><Empty>Isi Steam ID di <Link to="/">Dashboard</Link> terlebih dahulu.</Empty></>;

  const heroOf = (id) => heroes.find((h) => h.id === id);
  const alreadySaved = saved.items.some((a) => a.meta?.matchId === result.id && a.type === 'match');

  const save = () => {
    const m = matches.find((x) => String(x.match_id) === String(result.id));
    const name = heroOf(m?.hero_id)?.localizedName || 'Match';
    dispatch(analyses.create({ type: 'match', title: `${name} - match ${result.id}`, content: result.text, meta: { matchId: String(result.id) } }));
  };

  return (
    <>
      <h1>Analisis match</h1>
      {matchesStatus === 'loading' && <Loading text="Mengambil match terbaru..." />}
      <ErrorText>{matchesStatus === 'error' ? error : null}</ErrorText>
      {matchesStatus === 'ready' && matches.length === 0 && <Empty>Belum ada match yang bisa dibaca. Pastikan data match kamu publik.</Empty>}

      <div className="split">
        <ul className="match-list">
          {matches.map((m) => {
            const hero = heroOf(m.hero_id);
            const busy = result.status === 'loading' && String(result.id) === String(m.match_id);
            return (
              <li key={m.match_id} className={isWin(m) ? 'won' : 'lost'}>
                {hero && <img src={hero.icon} alt="" />}
                <div>
                  <strong>{hero?.localizedName || `Hero ${m.hero_id}`}</strong>
                  <span className="muted small">{isWin(m) ? 'Menang' : 'Kalah'} · {m.kills}/{m.deaths}/{m.assists} · {fmtDuration(m.duration)} · {fmtDate(m.start_time)}</span>
                </div>
                <button className="primary" disabled={busy} onClick={() => dispatch(analyzeMatch(m.match_id))}>
                  {busy ? 'Menganalisis...' : 'Analisis'}
                </button>
              </li>
            );
          })}
        </ul>

        <section className="panel result">
          {result.status === 'idle' && <Empty>Pilih match di samping untuk mendapatkan analisis dari AI.</Empty>}
          {result.status === 'loading' && <Loading text={`AI sedang membaca match ${result.id}...`} />}
          <ErrorText>{result.status === 'error' ? result.error : saved.error}</ErrorText>
          {result.status === 'ready' && (
            <>
              <Markdown>{result.text}</Markdown>
              <button className="ghost" disabled={alreadySaved} onClick={save}>{alreadySaved ? 'Sudah tersimpan' : 'Simpan analisis'}</button>
            </>
          )}
        </section>
      </div>
    </>
  );
}
