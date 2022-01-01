const uuidv4 = require('uuid')
exports.seed = function(knex) {
  return knex('posts_types').del()
    .then(function () {
      return knex('posts_types').insert([
        { id: uuidv4.v4(), type: 'ctf' },
        { id: uuidv4.v4(), type: 'writeup' },
        { id: uuidv4.v4(), type: 'tip' },
        { id: uuidv4.v4(), type: 'article' },
        { id: uuidv4.v4(), type: 'crypto' }
      ]);
    });
};
