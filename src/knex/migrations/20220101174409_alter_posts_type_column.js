exports.up = function(knex) {
  return knex.schema.alterTable('posts', table => {
    table.uuid('type_id').notNullable();
    table
      .foreign('type_id')
      .references('id')
      .inTable('posts_types');
  })
};

exports.down = function(knex) {
  return knex.schema.alterTable('posts', table => {
    table.dropColumn('type_id')
  })
};
