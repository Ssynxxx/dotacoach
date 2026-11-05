import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errMsg } from '../api';

const thunk = (type, fn) =>
  createAsyncThunk(`dota/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (e) {
      return rejectWithValue(errMsg(e));
    }
  });

export const fetchHeroes = thunk('heroes', async () => (await api.get('/dota/heroes')).data);
export const fetchProfile = thunk('profile', async (id) => (await api.get(`/dota/players/${id}`)).data);
export const fetchRecentMatches = thunk('recent', async (id) => (await api.get(`/dota/players/${id}/recent-matches`)).data);

const slice = createSlice({
  name: 'dota',
  initialState: {
    heroes: [],
    heroesStatus: 'idle',
    profile: null,
    profileStatus: 'idle',
    matches: [],
    matchesStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchHeroes.pending, (s) => void (s.heroesStatus = 'loading'))
      .addCase(fetchHeroes.fulfilled, (s, a) => {
        s.heroes = a.payload;
        s.heroesStatus = 'ready';
      })
      .addCase(fetchHeroes.rejected, (s, a) => {
        s.heroesStatus = 'error';
        s.error = a.payload;
      })
      .addCase(fetchProfile.pending, (s) => {
        s.profileStatus = 'loading';
        s.error = null;
      })
      .addCase(fetchProfile.fulfilled, (s, a) => {
        s.profile = a.payload;
        s.profileStatus = 'ready';
      })
      .addCase(fetchProfile.rejected, (s, a) => {
        s.profileStatus = 'error';
        s.error = a.payload;
      })
      .addCase(fetchRecentMatches.pending, (s) => {
        s.matchesStatus = 'loading';
        s.error = null;
      })
      .addCase(fetchRecentMatches.fulfilled, (s, a) => {
        s.matches = a.payload;
        s.matchesStatus = 'ready';
      })
      .addCase(fetchRecentMatches.rejected, (s, a) => {
        s.matchesStatus = 'error';
        s.error = a.payload;
      });
  },
});

export default slice.reducer;
