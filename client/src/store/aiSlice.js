import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errMsg } from '../api';

const thunk = (type, fn) =>
  createAsyncThunk(`ai/${type}`, async (arg, { rejectWithValue, getState }) => {
    try {
      return await fn(arg, getState);
    } catch (e) {
      return rejectWithValue(errMsg(e));
    }
  });

export const analyzeMatch = thunk('match', async (matchId) => (await api.post('/ai/match-analysis', { matchId })).data);
export const getDraftAdvice = thunk('draft', async (body) => (await api.post('/ai/draft', body)).data);
export const sendChat = thunk('chat', async (message, getState) => {
  const history = getState().ai.chat.slice(-10).map((m) => ({ role: m.role, text: m.text }));
  return (await api.post('/ai/chat', { message, history })).data.reply;
});

const slice = createSlice({
  name: 'ai',
  initialState: {
    match: { id: null, text: '', status: 'idle', error: null },
    draft: { text: '', status: 'idle', error: null },
    chat: [],
    chatStatus: 'idle',
    chatError: null,
  },
  reducers: {
    clearChat: (s) => void (s.chat = []),
  },
  extraReducers: (b) => {
    b.addCase(analyzeMatch.pending, (s, a) => {
      s.match = { id: a.meta.arg, text: '', status: 'loading', error: null };
    })
      .addCase(analyzeMatch.fulfilled, (s, a) => {
        s.match = { id: a.payload.matchId, text: a.payload.analysis, status: 'ready', error: null };
      })
      .addCase(analyzeMatch.rejected, (s, a) => {
        s.match.status = 'error';
        s.match.error = a.payload;
      })
      .addCase(getDraftAdvice.pending, (s) => {
        s.draft = { text: '', status: 'loading', error: null };
      })
      .addCase(getDraftAdvice.fulfilled, (s, a) => {
        s.draft = { text: a.payload.analysis, status: 'ready', error: null };
      })
      .addCase(getDraftAdvice.rejected, (s, a) => {
        s.draft.status = 'error';
        s.draft.error = a.payload;
      })
      .addCase(sendChat.pending, (s, a) => {
        s.chat.push({ role: 'user', text: a.meta.arg });
        s.chatStatus = 'loading';
        s.chatError = null;
      })
      .addCase(sendChat.fulfilled, (s, a) => {
        s.chat.push({ role: 'model', text: a.payload });
        s.chatStatus = 'ready';
      })
      .addCase(sendChat.rejected, (s, a) => {
        s.chatStatus = 'error';
        s.chatError = a.payload;
      });
  },
});

export const { clearChat } = slice.actions;
export default slice.reducer;
