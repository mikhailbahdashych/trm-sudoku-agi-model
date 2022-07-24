exports.up = function(knex) {
  return knex.schema.createTable('bookmarks', table => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid ()')).primary()

    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .notNullable()

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('bookmarks')
};
