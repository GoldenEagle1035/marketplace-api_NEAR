exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('albums', (t) => {
            t.increments().primary()
            t.timestamps()
            t.string('title')
            t.text('description')
            t.integer('user_id')
            t.foreign('user_id').references('id').inTable('users')
            t.text('url')
            t.boolean('is_deleted').default(false)
        }),
        knex.schema.createTableIfNotExists('songs', (t) => {
            t.increments().primary()
            t.timestamps()
            t.text('title')
            t.text('url')
            t.integer('album_id')
            t.foreign('album_id').references('id').inTable('albums')
            t.integer('owner_id')
            t.foreign('owner_id').references('id').inTable('users')
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('users')
    ])
};