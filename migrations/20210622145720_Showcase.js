exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('showcases', (t) => {
            t.increments().primary()
            t.timestamps()
            t.integer('album_id')
            t.foreign('album_id').references('id').inTable('albums')
            t.integer('user_id')
            t.foreign('user_id').references('id').inTable('users')
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('showcases'),
    ])
};