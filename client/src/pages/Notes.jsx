import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { notes } from '../store';
import { Empty, ErrorText, Loading } from '../components/Status';
import { fmtDate } from '../utils';

const blank = { title: '', matchId: '', content: '' };

export default function Notes() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((s) => s.notes);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (status === 'idle') dispatch(notes.fetchAll());
  }, [status, dispatch]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const action = editing ? notes.update({ id: editing, ...form }) : notes.create(form);
    const res = await dispatch(action);
    if (!res.error) {
      setForm(blank);
      setEditing(null);
    }
  };

  const edit = (n) => {
    setEditing(n.id);
    setForm({ title: n.title, matchId: n.matchId || '', content: n.content });
  };

  return (
    <>
      <h1>Catatan</h1>
      <form className="panel stack" onSubmit={submit}>
        <h2>{editing ? 'Ubah catatan' : 'Catatan baru'}</h2>
        <input value={form.title} onChange={set('title')} placeholder="Judul" aria-label="Judul" required maxLength={200} />
        <input value={form.matchId} onChange={set('matchId')} placeholder="Match ID (opsional)" aria-label="Match ID" />
        <textarea value={form.content} onChange={set('content')} placeholder="Apa yang mau kamu perbaiki di match berikutnya?" aria-label="Isi catatan" rows={4} required />
        <div className="row">
          <button className="primary" type="submit">{editing ? 'Simpan perubahan' : 'Tambah catatan'}</button>
          {editing && <button type="button" className="ghost" onClick={() => { setEditing(null); setForm(blank); }}>Batal</button>}
        </div>
        <ErrorText>{error}</ErrorText>
      </form>

      {status === 'loading' && <Loading />}
      {status === 'ready' && items.length === 0 && <Empty>Belum ada catatan. Tulis pelajaran dari match terakhirmu.</Empty>}
      <ul className="cards">
        {items.map((n) => (
          <li key={n.id} className="panel">
            <h3>{n.title}</h3>
            <p className="muted small">{fmtDate(n.createdAt)}{n.matchId ? ` · Match ${n.matchId}` : ''}</p>
            <p className="pre">{n.content}</p>
            <div className="row">
              <button className="ghost" onClick={() => edit(n)}>Ubah</button>
              <button className="ghost danger" onClick={() => dispatch(notes.remove(n.id))}>Hapus</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
