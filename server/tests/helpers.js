const jwt = require('jsonwebtoken');
const { User } = require('../src/models');

let counter = 0;
async function makeUser(overrides = {}) {
  counter += 1;
  const user = await User.create({ googleId: `g${counter}`, email: `u${counter}@mail.com`, name: `User ${counter}`, ...overrides });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  return { user, token, auth: `Bearer ${token}` };
}

module.exports = { makeUser };
