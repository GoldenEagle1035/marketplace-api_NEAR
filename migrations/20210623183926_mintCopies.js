exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.integer('available_qty')
            t.boolean('has_copy').default(true)
        }),
        knex.schema.alterTable('songs', (t) => {
            t.integer('available_qty')
            t.boolean('has_copy').default(true)
        }),
    ])
};

exports.down = function (knex) {
};