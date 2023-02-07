exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('songs', (t) => {
            t.boolean('is_purchased').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};