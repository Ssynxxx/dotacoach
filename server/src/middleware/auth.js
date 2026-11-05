const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError, asyncHandler } = require('../utils/AppError');

const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError(401, 'Silakan login terlebih dahulu');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, 'Sesi tidak valid atau sudah berakhir');
  }

  const user = await User.findByPk(decoded.id);
  if (!user) throw new AppError(401, 'Akun tidak ditemukan');
  req.user = user;
  next();
});

module.exports = { authenticate };
