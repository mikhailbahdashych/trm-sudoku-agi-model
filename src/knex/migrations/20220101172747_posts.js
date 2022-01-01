exports.up = function(knex) {
  return knex.schema
    .createTable('posts', function (table) {
      table.uuid('id').primary();
      table.string('title', 255).notNullable();
      table.text('plot', 'text').notNullable();
      table.text('text', 'mediumtext').notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    })
};

exports.down = function(knex) {
  return knex.schema.dropTable('posts')
};
