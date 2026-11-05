// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ message: err.errors?.[0]?.message || 'Data tidak valid' });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON tidak valid' });
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (process.env.NODE_ENV !== 'test') console.error(err);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}

module.exports = { errorHandler };
