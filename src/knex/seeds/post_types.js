exports.seed = function(knex) {
  return knex('table_name').del()
    .then(function () {
      return knex('post_types').insert([
        {type: 'question'},
        {type: 'forum'},
        {type: 'blog'}
      ]);
    });
};
