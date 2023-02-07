exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.text('qty')
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};