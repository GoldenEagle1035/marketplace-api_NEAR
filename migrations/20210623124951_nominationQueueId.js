exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('nominations', (t) => {
            t.integer('nomination_queue_id')
            t.foreign('nomination_queue_id').references('id').inTable('nomination_queues')
        }),
    ])
};

exports.down = function (knex) {
};