
exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('songs', (t) => {
            t.integer('user_id')
            t.foreign('user_id').references('id').inTable('users')
        }),
    ])
};

exports.down = function (knex) {

};
