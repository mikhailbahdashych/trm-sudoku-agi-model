exports.up = function(knex) {
  return knex.schema.createTable('tags', table => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid ()')).primary()
    table.string('tag').notNullable()
    table.integer('quantity').notNullable().defaultTo(1)
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('tags')
};
