exports.up = function(knex) {
  return knex.schema.createTable('post_types', table => {
    table.uuid('id').notNullable().defaultTo(knex.raw('gen_random_uuid ()')).primary()
    table.string('type')
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('post_types')
};
