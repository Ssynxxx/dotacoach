jest.mock('google-auth-library', () => {
  const verify = jest.fn();
  return { OAuth2Client: jest.fn(() => ({ verifyIdToken: verify })), __verify: verify };
});

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { __verify } = require('google-auth-library');
const app = require('../src/app');
const { sequelize } = require('../src/models');
const { makeUser } = require('./helpers');
const { toAccountId } = require('../src/utils/steam');
const { errorHandler } = require('../src/middleware/errorHandler');

beforeAll(() => sequelize.sync({ force: true }));
afterAll(() => sequelize.close());

describe('POST /auth/google', () => {
  it('membuat user baru dan mengembalikan JWT', async () => {
    __verify.mockResolvedValue({ getPayload: () => ({ sub: 'abc', email: 'a@b.com', name: 'Andi', picture: 'http://p' }) });
    const res = await request(app).post('/auth/google').send({ credential: 'tok' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('a@b.com');
    expect(jwt.verify(res.body.token, process.env.JWT_SECRET).id).toBe(res.body.user.id);
  });

  it('memakai user yang sama saat login ulang dan fallback nama ke email', async () => {
    __verify.mockResolvedValue({ getPayload: () => ({ sub: 'xyz', email: 'x@y.com' }) });
    const first = await request(app).post('/auth/google').send({ credential: 'tok' });
    const second = await request(app).post('/auth/google').send({ credential: 'tok' });
    expect(first.body.user.name).toBe('x@y.com');
    expect(second.body.user.id).toBe(first.body.user.id);
  });

  it('400 jika credential kosong', async () => {
    const res = await request(app).post('/auth/google').send({});
    expect(res.status).toBe(400);
  });

  it('401 jika token Google ditolak', async () => {
    __verify.mockRejectedValue(new Error('bad'));
    const res = await request(app).post('/auth/google').send({ credential: 'salah' });
    expect(res.status).toBe(401);
  });
});

describe('GET/PATCH /auth/me', () => {
  it('401 tanpa token', async () => {
    expect((await request(app).get('/auth/me')).status).toBe(401);
  });

  it('401 untuk token palsu', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer palsu');
    expect(res.status).toBe(401);
  });

  it('401 jika user sudah tidak ada', async () => {
    const token = jwt.sign({ id: 99999 }, process.env.JWT_SECRET);
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('mengembalikan profil user', async () => {
    const { auth, user } = await makeUser();
    const res = await request(app).get('/auth/me').set('Authorization', auth);
    expect(res.body.id).toBe(user.id);
  });

  it('menyimpan Steam32 dan mengonversi Steam64', async () => {
    const { auth } = await makeUser();
    const a = await request(app).patch('/auth/me').set('Authorization', auth).send({ steamId: '123456' });
    expect(a.body.steamId).toBe('123456');
    const b = await request(app).patch('/auth/me').set('Authorization', auth).send({ steamId: '76561198000000000' });
    expect(b.body.steamId).toBe('39734272');
  });

  it('menolak Steam ID tidak valid dan bisa menghapus Steam ID', async () => {
    const { auth } = await makeUser({ steamId: '5' });
    expect((await request(app).patch('/auth/me').set('Authorization', auth).send({ steamId: 'abc' })).status).toBe(400);
    const res = await request(app).patch('/auth/me').set('Authorization', auth).send({ steamId: '' });
    expect(res.body.steamId).toBeNull();
  });
});

describe('util & error handler', () => {
  it('toAccountId', () => {
    expect(toAccountId('76561197960265729')).toBe('1');
    expect(toAccountId('0')).toBeNull();
    expect(toAccountId('99999999999')).toBeNull();
    expect(toAccountId(undefined)).toBeNull();
  });

  it('404 untuk endpoint tidak dikenal dan 400 untuk JSON rusak', async () => {
    expect((await request(app).get('/tidak-ada')).status).toBe(404);
    expect((await request(app).get('/')).body.status).toBe('ok');
    const res = await request(app).post('/auth/google').set('Content-Type', 'application/json').send('{rusak');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('JSON tidak valid');
  });

  it('errorHandler memetakan error validasi dan error tak terduga', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorHandler({ name: 'SequelizeValidationError', errors: [{ message: 'kosong' }] }, {}, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    errorHandler({ name: 'SequelizeUniqueConstraintError' }, {}, res);
    expect(res.json).toHaveBeenLastCalledWith({ message: 'Data tidak valid' });
    errorHandler(new Error('boom'), {}, res);
    expect(res.status).toHaveBeenLastCalledWith(500);
  });
});
