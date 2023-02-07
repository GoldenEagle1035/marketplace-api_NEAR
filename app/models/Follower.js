var Model = require('../lib/db')

class Follower extends Model {
  static get tableName() {
    return 'followers'
  }

  static get relationMappings() {
    return {
      artist: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'followers.artist_id',
          to: 'users.id'
        }
      },
      follower: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'followers.follower_id',
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

module.exports = Follower
