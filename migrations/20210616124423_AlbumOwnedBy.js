exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.integer('current_owner')
            t.foreign('current_owner').references('id').inTable('users')
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};