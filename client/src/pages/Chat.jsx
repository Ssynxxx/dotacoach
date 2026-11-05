import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearChat, sendChat } from '../store/aiSlice';
import Markdown from '../components/Markdown';
import { ErrorText } from '../components/Status';

const IDEAS = ['Item apa yang penting untuk support di early game?', 'Bagaimana cara naik MMR dari hero yang paling sering aku mainkan?', 'Kapan sebaiknya buy Black King Bar?'];

export default function Chat() {
  const dispatch = useDispatch();
  const { chat, chatStatus, chatError } = useSelector((s) => s.ai);
  const [text, setText] = useState('');
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length, chatStatus]);

  const send = (message) => {
    const m = message.trim();
    if (!m || chatStatus === 'loading') return;
    dispatch(sendChat(m));
    setText('');
  };

  return (
    <>
      <div className="row between">
        <h1>Tanya coach</h1>
        {chat.length > 0 && <button className="ghost" onClick={() => dispatch(clearChat())}>Mulai percakapan baru</button>}
      </div>
      <div className="chat">
        {chat.length === 0 && (
          <div className="ideas">
            <p className="muted">Coach tahu win rate dan hero favoritmu jika Steam ID sudah diisi. Coba tanyakan:</p>
            {IDEAS.map((i) => <button key={i} className="ghost" onClick={() => send(i)}>{i}</button>)}
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>{m.role === 'model' ? <Markdown>{m.text}</Markdown> : m.text}</div>
        ))}
        {chatStatus === 'loading' && <div className="bubble model muted">Coach sedang mengetik...</div>}
        <div ref={end} />
      </div>
      <ErrorText>{chatError}</ErrorText>
      <form className="row" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis pertanyaan..." maxLength={1000} aria-label="Pesan" />
        <button className="primary" type="submit" disabled={chatStatus === 'loading' || !text.trim()}>Kirim</button>
      </form>
    </>
  );
}
