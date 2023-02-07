var Model = require('../lib/db')

class Showcase extends Model {
  static get tableName() {
    return 'showcases'
  }

  static get relationMappings() {
    return {
      album: {
        relation: Model.HasOneRelation,
        modelClass: 'Album',
        join: {
          from: 'showcases.album_id',
          to: 'albums.id'
        }
      },
      user: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'showcases.user_id',
          to: 'users.id'
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

module.exports = Showcase
