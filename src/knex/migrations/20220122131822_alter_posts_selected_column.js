exports.up = function(knex) {
  return knex.schema.alterTable('posts', table => {
    table.boolean('selected').nullable()
  })
};

exports.down = function(knex) {
  return knex.schema.alterTable('posts', table => {
    table.dropColumn('selected')
  })
};
