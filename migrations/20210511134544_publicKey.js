exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('users', (t) => {
            t.text('near_public_key')
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};