const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../utils/AppError');
const { toAccountId } = require('../utils/steam');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { credential } = req.body;
    if (!credential) throw new AppError(400, 'Credential Google wajib diisi');

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      throw new AppError(401, 'Token Google tidak valid');
    }

    const [user] = await User.findOrCreate({
      where: { googleId: payload.sub },
      defaults: { email: payload.email, name: payload.name || payload.email, picture: payload.picture },
    });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  })
);

router.get('/me', authenticate, (req, res) => res.json(req.user));

router.patch(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { steamId } = req.body;
    if (steamId === '' || steamId === null) {
      await req.user.update({ steamId: null });
      return res.json(req.user);
    }
    const accountId = toAccountId(steamId);
    if (!accountId) throw new AppError(400, 'Steam ID tidak valid. Gunakan Dota ID (angka) atau Steam64 ID.');
    await req.user.update({ steamId: accountId });
    res.json(req.user);
  })
);

module.exports = router;
