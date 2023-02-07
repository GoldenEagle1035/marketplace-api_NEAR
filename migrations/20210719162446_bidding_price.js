exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('transfers', (t) => {
            t.integer('bidding_price').unsigned()
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};