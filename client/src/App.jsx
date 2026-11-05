import { Route, Routes, Navigate } from 'react-router-dom';
import Protected from './components/Protected';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Heroes from './pages/Heroes';
import Matches from './pages/Matches';
import Draft from './pages/Draft';
import Chat from './pages/Chat';
import Notes from './pages/Notes';
import Saved from './pages/Saved';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="heroes" element={<Heroes />} />
        <Route path="matches" element={<Matches />} />
        <Route path="draft" element={<Draft />} />
        <Route path="chat" element={<Chat />} />
        <Route path="notes" element={<Notes />} />
        <Route path="saved" element={<Saved />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
