var Model = require('../lib/db')

class Playlist extends Model {
  static get tableName() {
    return 'playlists'
  }

  static get relationMappings() {
    return {
      songs: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Song',
        join: {
          from: 'playlists.id',
          through: {
            from: 'playlists_songs.playlist_id',
            to: 'playlists_songs.song_id'
          },
          to: 'songs.id'
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

module.exports = Playlist
