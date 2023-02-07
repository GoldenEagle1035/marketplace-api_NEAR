exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('transfers', (t) => {
            t.increments().primary()
            t.timestamps()
            t.integer('transfer_by')
            t.foreign('transfer_by').references('id').inTable('users')
            t.integer('transfer_to')
            t.foreign('transfer_to').references('id').inTable('users')
            t.string('transaction_hash')
            t.string('token')
            t.integer('copy_number')
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('transfers'),
    ])
};