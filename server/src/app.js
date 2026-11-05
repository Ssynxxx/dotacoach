require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Favorite, Note, Analysis } = require('./models');
const { crudRouter } = require('./routes/crud');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => res.json({ name: 'Dota Coach API', status: 'ok' }));
app.use('/auth', require('./routes/auth'));
app.use('/dota', require('./routes/dota'));
app.use('/ai', require('./routes/ai'));
app.use('/favorites', crudRouter(Favorite, { fields: ['heroId', 'heroName', 'note'], required: ['heroId', 'heroName'], uniqueBy: 'heroId' }));
app.use('/notes', crudRouter(Note, { fields: ['matchId', 'title', 'content'], required: ['title', 'content'] }));
app.use('/analyses', crudRouter(Analysis, { fields: ['type', 'title', 'content', 'meta'], required: ['type', 'title', 'content'] }));

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));
app.use(errorHandler);

module.exports = app;
