exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('transfers', (t) => {
            t.boolean('is_for_sale').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};