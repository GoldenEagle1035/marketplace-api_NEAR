exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('nominations', (t) => {
            t.increments().primary()
            t.timestamps()
            t.integer('nominee')
            t.foreign('nominee').references('id').inTable('users')
            t.integer('nominated_by')
            t.foreign('nominated_by').references('id').inTable('users')
            t.date('for_month')
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('nominations'),
    ])
};