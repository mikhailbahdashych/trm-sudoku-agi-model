exports.up = function(knex) {
  return knex.schema.createTable('session_tokens', table => {
    table.uuid('id').notNullable().primary()
    table.uuid('token_id').notNullable().defaultTo(knex.raw('gen_random_uuid ()'))
    table.uuid('user_id')
      .references('id')
      .inTable('users')
      .notNullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('session_tokens')
};
