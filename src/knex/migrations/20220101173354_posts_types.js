exports.up = function(knex) {
  return knex.schema
    .createTable('posts_types', function (table) {
      table.uuid('id').primary();
      table.text('type').notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    })
};

exports.down = function(knex) {
  return knex.schema.dropTable('posts_types')
};
