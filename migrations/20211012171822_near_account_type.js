exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('users', (t) => {
            t.string('near_account_type').default('new')
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};