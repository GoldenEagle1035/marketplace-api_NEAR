exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('nomination_queues', (t) => {
            t.increments().primary()
            t.timestamps()
            t.integer('nominee')
            t.foreign('nominee').references('id').inTable('users')
            t.date('for_month')
            t.boolean('is_opted').default(false)
            t.boolean('is_in_queue').default(true)
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('nomination_queues'),
    ])
};