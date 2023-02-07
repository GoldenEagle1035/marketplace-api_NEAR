var Model = require('../lib/db')

class PlaylistsSong extends Model {
  static get tableName() {
    return 'playlists_songs'
  }

  static get relationMappings() {
    return {
      song: {
        relation: Model.HasOneRelation,
        modelClass: 'Song',
        join: {
          from: 'playlists_songs.song_id',
          to: 'songs.id'
        }
      },
      playlist: {
        relation: Model.HasOneRelation,
        modelClass: 'Playlist',
        join: {
          from: 'playlists_songs.playlist_id',
          to: 'playlists.id'
        }
      },
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

module.exports = PlaylistsSong
