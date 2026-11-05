import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errMsg } from '../api';

// Slice CRUD generik untuk favorites, notes, dan analyses.
export function createCrudSlice(name, endpoint) {
  const wrap = (type, fn) =>
    createAsyncThunk(`${name}/${type}`, async (arg, { rejectWithValue }) => {
      try {
        return await fn(arg);
      } catch (e) {
        return rejectWithValue(errMsg(e));
      }
    });

  const fetchAll = wrap('fetchAll', async () => (await api.get(endpoint)).data);
  const create = wrap('create', async (data) => (await api.post(endpoint, data)).data);
  const update = wrap('update', async ({ id, ...data }) => (await api.put(`${endpoint}/${id}`, data)).data);
  const remove = wrap('remove', async (id) => {
    await api.delete(`${endpoint}/${id}`);
    return id;
  });

  const slice = createSlice({
    name,
    initialState: { items: [], status: 'idle', error: null },
    reducers: { clearError: (s) => void (s.error = null), reset: () => ({ items: [], status: 'idle', error: null }) },
    extraReducers: (b) => {
      b.addCase(fetchAll.pending, (s) => void (s.status = 'loading'))
        .addCase(fetchAll.fulfilled, (s, a) => {
          s.status = 'ready';
          s.items = a.payload;
        })
        .addCase(create.fulfilled, (s, a) => void s.items.unshift(a.payload))
        .addCase(update.fulfilled, (s, a) => {
          s.items = s.items.map((i) => (i.id === a.payload.id ? a.payload : i));
        })
        .addCase(remove.fulfilled, (s, a) => {
          s.items = s.items.filter((i) => i.id !== a.payload);
        })
        .addMatcher(
          (a) => a.type.startsWith(`${name}/`) && a.type.endsWith('/rejected'),
          (s, a) => {
            s.status = 'ready';
            s.error = a.payload;
          }
        );
    },
  });

  return { reducer: slice.reducer, actions: slice.actions, fetchAll, create, update, remove };
}
