exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('nomination_votes', (t) => {
            t.increments().primary()
            t.timestamps()
            t.integer('voter_id')
            t.foreign('voter_id').references('id').inTable('users')
            t.integer('nomination_id')
            t.foreign('nomination_id').references('id').inTable('nominations')
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('nomination_votes'),
    ])
};