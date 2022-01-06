exports.up = function(knex) {
  return knex.schema
    .createTable('picked_posts', table => {
      table.uuid('id').primary()
      table.uuid('post_id').notNullable()
      table
        .foreign('post_id')
        .references('id')
        .inTable('posts')
      table.text('place')
      table.timestamp("created_at").defaultTo(knex.fn.now());
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    })
};

exports.down = function(knex) {
  return knex.schema.dropTable('picked_posts')
};
