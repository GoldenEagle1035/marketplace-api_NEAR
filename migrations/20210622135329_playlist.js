exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('playlists', (t) => {
            t.increments().primary()
            t.timestamps()
            t.string('title')
            t.integer('user_id')
            t.foreign('user_id').references('id').inTable('users')
            t.boolean('is_deleted').default(false)
        }),
        knex.schema.createTableIfNotExists('playlists_songs', (t) => {
            t.increments().primary()
            t.timestamps()
            t.integer('song_id')
            t.foreign('song_id').references('id').inTable('songs')
            t.integer('playlist_id')
            t.foreign('playlist_id').references('id').inTable('playlists')
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('playlists'),
        knex.schema.dropTableIfExists('playlists_songs')
    ])
};