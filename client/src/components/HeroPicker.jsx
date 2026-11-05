import { useState } from 'react';

// Memilih hero dengan pencarian; menampilkan hero terpilih sebagai chip yang bisa dihapus.
export default function HeroPicker({ label, heroes, selected, max, onChange }) {
  const [q, setQ] = useState('');
  const byId = Object.fromEntries(heroes.map((h) => [h.id, h]));
  const matches = q.trim()
    ? heroes.filter((h) => h.localizedName.toLowerCase().includes(q.toLowerCase()) && !selected.includes(h.id)).slice(0, 6)
    : [];

  const add = (id) => {
    if (selected.length < max) onChange([...selected, id]);
    setQ('');
  };

  return (
    <div className="picker">
      <h3>{label} <span className="muted">({selected.length}/{max})</span></h3>
      <div className="chips">
        {selected.map((id) => (
          <button key={id} className="chip" onClick={() => onChange(selected.filter((x) => x !== id))} title="Klik untuk menghapus">
            <img src={byId[id]?.icon} alt="" /> {byId[id]?.localizedName} ×
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={selected.length >= max ? 'Slot penuh' : 'Cari hero...'}
        disabled={selected.length >= max}
        aria-label={`Cari hero ${label}`}
      />
      {matches.length > 0 && (
        <ul className="suggest">
          {matches.map((h) => (
            <li key={h.id}>
              <button onClick={() => add(h.id)}><img src={h.icon} alt="" /> {h.localizedName}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
