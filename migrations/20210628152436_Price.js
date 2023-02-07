exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.integer('price').unsigned()
        }),
        knex.schema.alterTable('songs', (t) => {
            t.integer('price').unsigned()
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};