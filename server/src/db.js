require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize =
  process.env.NODE_ENV === 'test'
    ? new Sequelize('sqlite::memory:', { logging: false })
    : new Sequelize(process.env.DATABASE_URL, {
        logging: false,
        dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
      });

module.exports = sequelize;
