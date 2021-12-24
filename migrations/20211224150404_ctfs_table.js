exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('ctfs', function (table) {
      table.uuid('id').primary();
      table.string('title', 255).notNullable();
      table.text('text', 'mediumtext').notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    })
};

exports.down = function(knex) {
  return knex.schema.dropTable('ctfs')
};
