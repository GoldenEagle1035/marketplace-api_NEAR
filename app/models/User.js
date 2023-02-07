var Model = require('../lib/db')

class User extends Model {
  static get tableName() {
    return 'users'
  }

  static get relationMappings() {
    return {
      showcases: {
        relation: Model.HasManyRelation,
        modelClass: 'Showcase',
        join: {
          from: 'users.id',
          to: 'showcases.user_id'
        }
      },
      songs: {
        relation: Model.HasManyRelation,
        modelClass: 'Song',
        join: {
          from: 'users.id',
          to: 'songs.user_id'
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
      'username', 'name'
    ]
  }

  safeValues(obj) {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      banner: this.banner,
      type: obj && obj.type ? this.type : undefined,
      songs: (this.songs || []).length
    }
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

module.exports = User
