exports.up = function(knex) {
  return knex.schema.alterTable('posts', table => {
    table.text('cover')
  })
};

exports.down = function(knex) {
  return knex.schema.alterTable('posts', table => {
    table.dropColumn('cover')
  })
};
