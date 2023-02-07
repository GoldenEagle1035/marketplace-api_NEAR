exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('users', (t) => {
            t.increments().primary()
            t.timestamps()
            t.string('name')
            t.string('username')
            t.string('twitter_id')
            t.text('avatar')
            t.text('banner')
            t.string('near_account_id')
            t.boolean('connected_to_near').default(false)
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('users')
    ])
};