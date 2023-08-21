const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../../exceptions/InvariantError');
const NotFoundError = require('../../../exceptions/NotFoundError');
const { songMapDBToModel } = require('../../../utils/models/songs');

class Index {
  constructor() {
    this._pool = new Pool();
  }

  async postSong({
    title, year, performer, genre, duration, album_id,
  }) {
    const id = `song-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5,$6,$7,$8,$9) RETURNING id',
      values: [id, title, year, genre, performer, duration, album_id, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('songs gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs(request) {
    const { title, performer } = request.query;
    if (!title && !performer) {
      const result = await this._pool.query('SELECT * FROM songs');
      return result.rows.map((song) => ({
        id: song.id,
        title: song.title,
        performer: song.performer,
      }));
    }
    let queryText = 'SELECT * FROM songs WHERE 1 = 1';
    const queryValues = [];

    if (title) {
      queryText += ` AND title ILIKE $${queryValues.length + 1}`;
      queryValues.push(`%${title}%`);
    }

    if (performer) {
      queryText += ` AND performer ILIKE $${queryValues.length + 1}`;
      queryValues.push(`%${performer}%`);
    }

    const query = {
      text: queryText,
      values: queryValues,
    };

    const result = await this._pool.query(query);
    return result.rows.map((song) => ({
      id: song.id,
      title: song.title,
      performer: song.performer,
    }));
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('songs tidak ditemukan');
    }
    return songMapDBToModel(result.rows[0]);
  }

  async editSongById(id, {
    title, year, performer, genre, duration, albumId,
  }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, album_id = $6, updated_at = $7 WHERE id = $8 RETURNING id',
      values: [title, year, performer, genre, duration, albumId, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui songs. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('songs gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = Index;
