exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.string('cover_cid')
        }),
        knex.schema.alterTable('songs', (t) => {
            t.string('song_cid')
        }),
    ])
};

exports.down = function (knex) {
};