var Model = require('../lib/db')

class Song extends Model {
  static get tableName() {
    return 'songs'
  }

  static get relationMappings() {
    return {
      album: {
        relation: Model.BelongsToOneRelation,
        modelClass: 'Album',
        join: {
          from: 'songs.album_id',
          to: 'albums.id'
        }
      },
      playlists: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Playlist',
        join: {
          from: 'songs.id',
          through: {
            from: 'playlists_songs.song_id',
            to: 'playlists_songs.playlist_id'
          },
          to: 'playlists.id'
        }
      },
      artist: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'songs.user_id',
          to: 'users.id'
        }
      },
      currentOwner: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'songs.current_owner',
          to: 'users.id'
        }
      },
      transfers: {
        relation: Model.HasManyRelation,
        modelClass: 'Transfer',
        join: {
          to: 'transfers.token',
          from: 'songs.song_cid'
        }
      },
    }
  }
  safeValues({ user_id, is_for_sale }) {
    return {
      id: this.id,
      title: this.title,
      song_cid: this.song_cid,
      album: this.album && this.album.safeValues({}),
      artist: this.artist && this.artist.safeValues({}),
      available_qty: this.available_qty,
      qty: parseInt(this.qty) || 0,
      transfers: (this.transfers || []).map(t => t.safeValues({})).filter(f => is_for_sale ? f.is_for_sale : is_for_sale === false ? !f.is_for_sale : true),
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

module.exports = Song
