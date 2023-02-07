exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.integer('minting_cost').unsigned()
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};