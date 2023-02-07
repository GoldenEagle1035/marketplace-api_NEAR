exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.string('cid')
        }),
        knex.schema.alterTable('songs', (t) => {
            t.string('cid')
        }),
    ])
};

exports.down = function (knex) {
};