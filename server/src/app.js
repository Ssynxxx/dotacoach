
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { Favorite, Note, Analysis } = require('./models');
const { crudRouter } = require('./routes/crud');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = [
  'https://dotacoaching.online',
  'https://www.dotacoaching.online',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('CORS blocked origin:', origin);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  credentials: true
}));

app.use(express.json({ limit: '100kb' }));

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'Dota Coach API',
    status: 'ok'
  });
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/dota', require('./routes/dota'));
app.use('/ai', require('./routes/ai'));

app.use('/favorites', crudRouter(Favorite, {
  fields: ['heroId', 'heroName', 'note'],
  required: ['heroId', 'heroName'],
  uniqueBy: 'heroId'
}));

app.use('/notes', crudRouter(Note, {
  fields: ['matchId', 'title', 'content'],
  required: ['title', 'content']
}));

app.use('/analyses', crudRouter(Analysis, {
  fields: ['type', 'title', 'content', 'meta'],
  required: ['type', 'title', 'content']
}));

// 404
app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint tidak ditemukan'
  });
});

// Error handler
app.use(errorHandler);

// Export Express app
module.exports = app;
