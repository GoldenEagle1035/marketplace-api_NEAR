exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('songs', (t) => {
            t.dropColumn('owner_id')
        }),
    ])
};

exports.down = function (knex) {
};