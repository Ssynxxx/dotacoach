const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');
const { makeUser } = require('./helpers');

beforeAll(() => sequelize.sync({ force: true }));
afterAll(() => sequelize.close());

describe('Favorites', () => {
  it('CRUD lengkap', async () => {
    const { auth } = await makeUser();
    const created = await request(app).post('/favorites').set('Authorization', auth).send({ heroId: 1, heroName: 'Anti-Mage', note: 'main' });
    expect(created.status).toBe(201);

    const list = await request(app).get('/favorites').set('Authorization', auth);
    expect(list.body).toHaveLength(1);

    const one = await request(app).get(`/favorites/${created.body.id}`).set('Authorization', auth);
    expect(one.body.heroName).toBe('Anti-Mage');

    const updated = await request(app).put(`/favorites/${created.body.id}`).set('Authorization', auth).send({ note: 'carry' });
    expect(updated.body.note).toBe('carry');

    const del = await request(app).delete(`/favorites/${created.body.id}`).set('Authorization', auth);
    expect(del.status).toBe(200);
    expect((await request(app).get(`/favorites/${created.body.id}`).set('Authorization', auth)).status).toBe(404);
  });

  it('validasi: field wajib, duplikat, dan tidak boleh dikosongkan', async () => {
    const { auth } = await makeUser();
    expect((await request(app).post('/favorites').set('Authorization', auth).send({ heroId: 2 })).status).toBe(400);
    const ok = await request(app).post('/favorites').set('Authorization', auth).send({ heroId: 2, heroName: 'Axe' });
    expect((await request(app).post('/favorites').set('Authorization', auth).send({ heroId: 2, heroName: 'Axe' })).status).toBe(409);
    expect((await request(app).put(`/favorites/${ok.body.id}`).set('Authorization', auth).send({ heroName: '' })).status).toBe(400);
  });

  it('data user lain tidak bisa diakses dan ID non-angka ditolak', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const fav = await request(app).post('/favorites').set('Authorization', a.auth).send({ heroId: 3, heroName: 'Bane' });
    expect((await request(app).get(`/favorites/${fav.body.id}`).set('Authorization', b.auth)).status).toBe(404);
    expect((await request(app).delete(`/favorites/${fav.body.id}`).set('Authorization', b.auth)).status).toBe(404);
    expect((await request(app).get('/favorites/abc').set('Authorization', b.auth)).status).toBe(404);
    expect((await request(app).get('/favorites/abc')).status).toBe(401);
    expect((await request(app).get('/favorites').set('Authorization', b.auth)).body).toHaveLength(0);
  });
});

describe('Notes & Analyses', () => {
  it('Notes: create, update, list', async () => {
    const { auth } = await makeUser();
    const n = await request(app).post('/notes').set('Authorization', auth).send({ title: 'Lane', content: 'Harus lebih agresif', matchId: '123' });
    expect(n.status).toBe(201);
    const up = await request(app).put(`/notes/${n.body.id}`).set('Authorization', auth).send({ title: 'Lane phase' });
    expect(up.body.title).toBe('Lane phase');
    expect((await request(app).get('/notes').set('Authorization', auth)).body).toHaveLength(1);
    expect((await request(app).post('/notes').set('Authorization', auth).send({ title: 'x' })).status).toBe(400);
  });

  it('Analyses: simpan hasil AI dan validasi enum', async () => {
    const { auth } = await makeUser();
    const ok = await request(app).post('/analyses').set('Authorization', auth).send({ type: 'match', title: 'Match 1', content: '# Hasil', meta: { matchId: '1' } });
    expect(ok.status).toBe(201);
    expect(ok.body.meta.matchId).toBe('1');
    const bad = await request(app).post('/analyses').set('Authorization', auth).send({ type: 'lain', title: 'x', content: 'y' });
    expect(bad.status).toBe(400);
  });
});
