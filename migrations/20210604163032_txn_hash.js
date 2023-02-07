exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.string('txn_hash')
        }),
        knex.schema.alterTable('songs', (t) => {
            t.string('txn_hash')
        }),
    ])
};

exports.down = function (knex) {
};