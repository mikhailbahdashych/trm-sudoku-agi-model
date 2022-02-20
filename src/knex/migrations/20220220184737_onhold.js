exports.up = function(knex) {
  return knex.schema.alterTable('posts', table => {
    table.boolean('hold').nullable()
  })
};

exports.down = function(knex) {
  return knex.schema.alterTable('posts', table => {
    table.dropColumn('hold')
  })
};
