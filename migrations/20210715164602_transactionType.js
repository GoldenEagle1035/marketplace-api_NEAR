exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('transfers', (t) => {
            t.string('type')
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};