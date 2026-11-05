import { NavLink, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';

const links = [
  ['/', 'Dashboard'],
  ['/heroes', 'Hero'],
  ['/matches', 'Analisis match'],
  ['/draft', 'Draft coach'],
  ['/chat', 'Tanya coach'],
  ['/notes', 'Catatan'],
  ['/saved', 'Tersimpan'],
];

export default function Layout() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Dota Coach</div>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="me">
          {user?.picture && <img src={user.picture} alt="" referrerPolicy="no-referrer" />}
          <span>{user?.name}</span>
          <button className="ghost" onClick={() => dispatch(logout())}>Keluar</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
