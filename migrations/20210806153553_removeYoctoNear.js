exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('albums', (t) => {
            t.dropColumn('yocto_near_price')
        })
    ])
};

exports.down = function (knex) {
};