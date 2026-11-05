import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errMsg } from '../api';

const thunk = (type, fn) =>
  createAsyncThunk(`auth/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (e) {
      return rejectWithValue(errMsg(e));
    }
  });

export const loginWithGoogle = thunk('login', async (credential) => (await api.post('/auth/google', { credential })).data);
export const fetchMe = thunk('me', async () => (await api.get('/auth/me')).data);
export const saveSteamId = thunk('steam', async (steamId) => (await api.patch('/auth/me', { steamId })).data);

const slice = createSlice({
  name: 'auth',
  initialState: { token: localStorage.getItem('token'), user: null, status: 'idle', error: null },
  reducers: {
    logout(state) {
      localStorage.removeItem('token');
      state.token = null;
      state.user = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(loginWithGoogle.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    })
      .addCase(loginWithGoogle.fulfilled, (s, a) => {
        localStorage.setItem('token', a.payload.token);
        s.token = a.payload.token;
        s.user = a.payload.user;
        s.status = 'ready';
      })
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.user = a.payload;
        s.status = 'ready';
      })
      .addCase(fetchMe.rejected, (s) => {
        localStorage.removeItem('token');
        s.token = null;
        s.status = 'ready';
      })
      .addCase(saveSteamId.pending, (s) => void (s.error = null))
      .addCase(saveSteamId.fulfilled, (s, a) => void (s.user = a.payload))
      .addCase(loginWithGoogle.rejected, (s, a) => {
        s.status = 'ready';
        s.error = a.payload;
      })
      .addCase(saveSteamId.rejected, (s, a) => void (s.error = a.payload));
  },
});

export const { logout } = slice.actions;
export default slice.reducer;
