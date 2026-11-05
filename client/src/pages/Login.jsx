import { GoogleLogin } from '@react-oauth/google';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithGoogle } from '../store/authSlice';
import { ErrorText } from '../components/Status';

export default function Login() {
  const dispatch = useDispatch();
  const { token, error, status } = useSelector((s) => s.auth);
  if (token) return <Navigate to="/" replace />;

  return (
    <div className="login">
      <div className="login-copy">
        <h1>Kenapa kamu kalah di match tadi?</h1>
        <p>
          Dota Coach membaca data match kamu dari OpenDota, lalu AI menjelaskan di mana game-nya berubah dan apa yang bisa
          diperbaiki di match berikutnya.
        </p>
        <ul>
          <li>Analisis match: GPM, KDA, item, dan saran perbaikan</li>
          <li>Draft coach: pick dan counter berdasarkan hero tim</li>
          <li>Tanya coach soal hero, item, dan meta</li>
        </ul>
      </div>
      <div className="login-card">
        <h2>Masuk</h2>
        <p className="muted">Pakai akun Google untuk menyimpan catatan dan hasil analisis.</p>
        <GoogleLogin
          onSuccess={(res) => dispatch(loginWithGoogle(res.credential))}
          onError={() => dispatch({ type: 'auth/login/rejected', payload: 'Login Google gagal, coba lagi' })}
          theme="filled_black"
        />
        {status === 'loading' && <p className="muted">Memverifikasi...</p>}
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  );
}
