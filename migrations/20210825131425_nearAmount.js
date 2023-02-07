exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('transfers', (t) => {
            t.string('yocto_near_price')
            t.integer('price_in_usd').unsigned()
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};