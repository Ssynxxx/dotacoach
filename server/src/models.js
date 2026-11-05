const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('User', {
  googleId: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  picture: DataTypes.STRING,
  steamId: DataTypes.STRING,
});

const Favorite = sequelize.define('Favorite', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  heroId: { type: DataTypes.INTEGER, allowNull: false },
  heroName: { type: DataTypes.STRING, allowNull: false },
  note: DataTypes.STRING,
});

const Note = sequelize.define('Note', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  matchId: DataTypes.STRING,
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
});

const Analysis = sequelize.define('Analysis', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('match', 'draft', 'chat'), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  meta: DataTypes.JSON,
});

for (const Model of [Favorite, Note, Analysis]) {
  User.hasMany(Model, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Model.belongsTo(User, { foreignKey: 'userId' });
}

module.exports = { sequelize, User, Favorite, Note, Analysis };
