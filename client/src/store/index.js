import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import dota from './dotaSlice';
import ai from './aiSlice';
import { createCrudSlice } from './crudSlice';

export const favorites = createCrudSlice('favorites', '/favorites');
export const notes = createCrudSlice('notes', '/notes');
export const analyses = createCrudSlice('analyses', '/analyses');

export const store = configureStore({
  reducer: { auth, dota, ai, favorites: favorites.reducer, notes: notes.reducer, analyses: analyses.reducer },
});
