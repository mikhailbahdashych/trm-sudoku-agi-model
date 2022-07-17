exports.up = function(knex) {
  return knex.schema.createTable('questions', table => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid ()')).primary()
    table.string('title', 100).notNullable()
    table.string('slug').unique().notNullable()
    table.text('content').notNullable()

    table.uuid('author_id')
      .references('id')
      .inTable('users')
      .notNullable()

    table.boolean('notify').notNullable().defaultTo(false)

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('questions')
};
