exports.up = function(knex) {
  return knex.schema.createTable('users_info', table => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid ()')).primary()
    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .notNullable()
    table.text('username').notNullable()
    table.text('first_name').nullable()
    table.text('last_name').nullable()
    table.text('title').nullable()
    table.text('company').nullable()
    table.text('location').nullable()
    table.text('about_me').nullable()
    table.text('website_link').nullable()
    table.text('twitter').nullable()
    table.text('github').nullable()
    table.boolean('show_email').notNullable().defaultTo(false)

    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('users_info')
};
