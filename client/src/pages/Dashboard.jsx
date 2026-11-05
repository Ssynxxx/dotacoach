import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveSteamId } from '../store/authSlice';
import { fetchProfile } from '../store/dotaSlice';
import { ErrorText, Loading } from '../components/Status';
import { rankName, winRate } from '../utils';

export default function Dashboard() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const authError = useSelector((s) => s.auth.error);
  const { profile, profileStatus, error } = useSelector((s) => s.dota);
  const [steamId, setSteamId] = useState(user.steamId || '');

  useEffect(() => {
    if (user.steamId) dispatch(fetchProfile(user.steamId));
  }, [user.steamId, dispatch]);

  const submit = (e) => {
    e.preventDefault();
    dispatch(saveSteamId(steamId.trim()));
  };

  return (
    <>
      <h1>Halo, {user.name.split(' ')[0]}</h1>

      <section className="panel">
        <h2>Akun Dota 2</h2>
        <form onSubmit={submit} className="row">
          <input value={steamId} onChange={(e) => setSteamId(e.target.value)} placeholder="Dota ID atau Steam64 ID" aria-label="Steam ID" />
          <button className="primary" type="submit">Simpan</button>
        </form>
        <p className="muted small">Dota ID ada di profil Dota 2 (angka di bawah nama). Profil harus mengaktifkan “Expose Public Match Data”.</p>
        <ErrorText>{authError}</ErrorText>
      </section>

      {!user.steamId && <p className="empty">Isi Steam ID dulu untuk melihat statistik dan menganalisis match.</p>}
      {user.steamId && profileStatus === 'loading' && <Loading text="Mengambil data dari OpenDota..." />}
      <ErrorText>{profileStatus === 'error' ? error : null}</ErrorText>

      {user.steamId && profileStatus === 'ready' && profile && (
        <section className="panel">
          <div className="profile">
            {profile.profile?.avatarfull && <img src={profile.profile.avatarfull} alt="" />}
            <div>
              <h2>{profile.profile?.personaname || 'Pemain tanpa profil publik'}</h2>
              <p className="muted">{rankName(profile.rankTier)}</p>
            </div>
            <div className="stat"><strong className="win">{profile.winLoss.win}</strong><span>menang</span></div>
            <div className="stat"><strong className="loss">{profile.winLoss.lose}</strong><span>kalah</span></div>
            <div className="stat"><strong>{winRate(profile.winLoss.win, profile.winLoss.lose)}%</strong><span>win rate</span></div>
          </div>
          <h3>Hero paling sering dimainkan</h3>
          <table>
            <thead><tr><th>Hero</th><th>Game</th><th>Menang</th><th>Win rate</th></tr></thead>
            <tbody>
              {profile.topHeroes.map((h) => (
                <tr key={h.heroId}>
                  <td className="hero-cell">{h.icon && <img src={h.icon} alt="" />} {h.hero}</td>
                  <td>{h.games}</td>
                  <td>{h.win}</td>
                  <td>{winRate(h.win, h.games - h.win)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
