exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('followers', (t) => {
            t.increments().primary()
            t.timestamps()
            t.integer('follower_id')
            t.foreign('follower_id').references('id').inTable('users')
            t.integer('artist_id')
            t.foreign('artist_id').references('id').inTable('users')
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('followers'),
    ])
};