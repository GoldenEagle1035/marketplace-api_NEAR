exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('nominations', (t) => {
            t.dropColumn('nomination_queue_id')
        }),
        knex.schema.dropTableIfExists('nomination_queues'),
    ])
};

exports.down = function (knex) {
};