exports.seed = function(knex) {
  return knex('post_types').del()
    .then(function () {
      return knex('post_types').insert([
        {type: 'question'},
        {type: 'forum'},
        {type: 'blog'}
      ]);
    });
};
