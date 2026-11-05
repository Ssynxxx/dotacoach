const express = require('express');
const { authenticate } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../utils/AppError');

// Router CRUD generik yang selalu dibatasi ke data milik user yang login.
function crudRouter(Model, { fields, required = [], uniqueBy }) {
  const router = express.Router();
  router.use(authenticate);

  const pick = (body) => Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
  const isEmpty = (v) => v === undefined || v === null || v === '';

  const findOwn = async (req) => {
    const id = Number(req.params.id);
    const item = Number.isInteger(id) ? await Model.findOne({ where: { id, userId: req.user.id } }) : null;
    if (!item) throw new AppError(404, 'Data tidak ditemukan');
    return item;
  };

  router.get(
    '/',
    asyncHandler(async (req, res) =>
      res.json(await Model.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] }))
    )
  );

  router.get('/:id', asyncHandler(async (req, res) => res.json(await findOwn(req))));

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const data = pick(req.body);
      const missing = required.filter((f) => isEmpty(data[f]));
      if (missing.length) throw new AppError(400, `${missing.join(', ')} wajib diisi`);
      if (uniqueBy && (await Model.findOne({ where: { userId: req.user.id, [uniqueBy]: data[uniqueBy] } }))) {
        throw new AppError(409, 'Data sudah ada');
      }
      res.status(201).json(await Model.create({ ...data, userId: req.user.id }));
    })
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const item = await findOwn(req);
      const data = pick(req.body);
      const emptied = required.filter((f) => f in data && isEmpty(data[f]));
      if (emptied.length) throw new AppError(400, `${emptied.join(', ')} tidak boleh kosong`);
      res.json(await item.update(data));
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      await (await findOwn(req)).destroy();
      res.json({ message: 'Data berhasil dihapus' });
    })
  );

  return router;
}

module.exports = { crudRouter };
