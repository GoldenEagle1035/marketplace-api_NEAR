var Model = require('../lib/db')

class Transfer extends Model {
  static get tableName() {
    return 'transfers'
  }

  static get relationMappings() {
    return {
      transferBy: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'transfers.transfer_by',
          to: 'users.id'
        }
      },
      transferTo: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'transfers.transfer_to',
          to: 'users.id'
        }
      },
      album: {
        relation: Model.HasOneRelation,
        modelClass: 'Album',
        join: {
          from: 'transfers.token',
          to: 'albums.cover_cid'
        }
      },
      song: {
        relation: Model.HasOneRelation,
        modelClass: 'Song',
        join: {
          from: 'transfers.token',
          to: 'songs.song_cid'
        }
      },
    }
  }
  safeValues({ }) {
    return {
      id: this.id,
      created_at: this.created_at,
      song: this.song && this.song.safeValues({}),
      album: this.album && this.album.safeValues({}),
      artist: this.artist && this.artist.safeValues({}),
      transferTo: this.transferTo && this.transferTo.safeValues({}),
      copy_number: this.copy_number,
      bidding_price: this.bidding_price,
      available_qty: this.available_qty,
      is_for_sale: this.is_for_sale,
      transaction_hash: this.transaction_hash
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

module.exports = Transfer
