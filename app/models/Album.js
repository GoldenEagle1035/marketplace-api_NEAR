var Model = require('../lib/db')

class Album extends Model {
  static get tableName() {
    return 'albums'
  }

  static get relationMappings() {
    return {
      songs: {
        relation: Model.HasManyRelation,
        modelClass: 'Song',
        join: {
          to: 'songs.album_id',
          from: 'albums.id'
        }
      },
      transfers: {
        relation: Model.HasManyRelation,
        modelClass: 'Transfer',
        join: {
          to: 'transfers.token',
          from: 'albums.cover_cid'
        }
      },
      currentOwner: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'albums.current_owner',
          to: 'users.id'
        }
      },
      user: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'albums.user_id',
          to: 'users.id'
        }
      },
    }
  }
  safeValues({ user_id }) {
    return {
      id: this.id,
      title: this.title,
      cover_cid: this.cover_cid,
      qty: parseInt(this.qty) || 0,
      available_qty: this.available_qty,
      price: this.price,
      user: this.user,
      songs: this.songs && this.songs.map(s => s.safeValues({})),
      mints_owned: (this.transfers || []).filter(t => t.is_owner && t.transfer_to === user_id).map(t => t.copy_number)
    }
  }
  $beforeUpdate(opt, quetyContext) {
    this.updated_at = new Date().toISOString()
  }

  $beforeInsert() {
    this.updated_at, this.created_at = new Date().toISOString()
  }

  static getSearchable() {
    return [
    ]
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],
      properties: {
        id: { type: 'integer' },
      }
    }
  }

  static get modelPaths() {
    return [__dirname]
  }
}

module.exports = Album
