import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '../store/authSlice';
import Layout from './Layout';
import { Loading } from './Status';

export default function Protected() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token && !user) dispatch(fetchMe());
  }, [token, user, dispatch]);

  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <Loading text="Memuat akun..." />;
  return <Layout />;
}
