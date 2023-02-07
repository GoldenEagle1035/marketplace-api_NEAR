exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('users', (t) => {
            t.string('type').default('user')
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};