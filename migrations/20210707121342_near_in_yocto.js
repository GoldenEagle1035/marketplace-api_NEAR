exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.string('yocto_near_price')
        }),
        knex.schema.alterTable('songs', (t) => {
            t.string('yocto_near_price')
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
    ])
};