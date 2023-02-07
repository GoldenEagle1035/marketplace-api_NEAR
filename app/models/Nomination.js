var Model = require('../lib/db')

class Nomination extends Model {
  static get tableName() {
    return 'nominations'
  }

  static get relationMappings() {
    return {
      votedFor: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'nominations.nominee',
          to: 'users.id'
        }
      },
      votedBy: {
        relation: Model.HasOneRelation,
        modelClass: 'User',
        join: {
          from: 'nominations.nominated_by',
          to: 'users.id'
        }
      },
      votes: {
        relation: Model.HasManyRelation,
        modelClass: 'NominationVote',
        join: {
          from: 'nominations.id',
          to: 'nomination_votes.nomination_id'
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

module.exports = Nomination
