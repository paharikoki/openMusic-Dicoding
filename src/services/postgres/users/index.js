const { Pool } = require('pg');
const { nanoid } = require('nanoid');
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcrypt');
const InvariantError = require('../../../exceptions/InvariantError');
const NotFoundError = require('../../../exceptions/NotFoundError');

class Index {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    await this.verifyNewUsername(username);
    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4,$5,$5) RETURNING id',
      values: [id, username, hashedPassword, fullname, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('User gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async verifyNewUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    const result = await this._pool.query(query);

    if (result.rows.length > 0) {
      throw new InvariantError('Gagal menambahkan user. Username sudah digunakan.');
    }
  }

  async getUserById(userId) {
    const query = {
      text: 'SELECT id, username, fullname FROM users WHERE id = $1',
      values: [userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('User tidak ditemukan');
    }

    return result.rows[0];
  }
}

module.exports = Index;