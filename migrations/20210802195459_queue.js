exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('nominations', (t) => {
            t.boolean('is_in_queue').default(true)
        }),
    ])
};

exports.down = function (knex) {
};