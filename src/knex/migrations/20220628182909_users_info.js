exports.up = function(knex) {
  return knex.schema.createTable('users_info', table => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid ()')).primary()
    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .notNullable()
    table.string('username').notNullable()
    table.string('first_name').nullable()
    table.string('last_name').nullable()
    table.string('status').nullable()
    table.string('company').nullable()
    table.string('location').nullable()
    table.string('about_me').nullable()
    table.string('website_link').nullable()
    table.string('twitter').nullable()
    table.string('github').nullable()
    table.integer('reputation').defaultTo(0)
    table.boolean('show_email').notNullable().defaultTo(false)

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('users_info')
};
