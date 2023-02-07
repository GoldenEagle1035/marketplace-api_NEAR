exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('transfers', (t) => {
            t.boolean('is_owner').default(true)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};