exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.dropColumn('url')
            t.dropColumn('qty')
        }),
        knex.schema.alterTable('songs', (t) => {
            t.dropColumn('url')
            t.string('lyricist')
            t.string('genre')
            t.string('singer')
            t.date('released_year')
        }),
    ])
};

exports.down = function (knex) {
};