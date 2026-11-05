const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

sequelize
  .sync()
  .then(() => app.listen(PORT, () => console.log(`Dota Coach API berjalan di port ${PORT}`)))
  .catch((err) => {
    console.error('Gagal terhubung ke database:', err.message);
    process.exit(1);
  });
