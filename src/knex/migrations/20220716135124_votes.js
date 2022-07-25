exports.up = function(knex) {
  return knex.schema.createTable('votes', table => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid ()')).primary()

    table.uuid('post_id').notNullable()
    table.uuid('post_type_id')
      .references('id')
      .inTable('post_types')
      .notNullable()

    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .notNullable()

    table.enum('vote', [0, 1]).notNullable()

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('votes')
};
