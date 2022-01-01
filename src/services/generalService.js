const knex = require('../knex/knex')
const uuid = require('uuid');
const tableName = 'posts'

module.exports = {
  async getLatestReleases(q) {
    return knex('posts')
      .select('posts.id', 'posts.title', 'posts.plot', 'posts.text', 'posts.created_at', 'posts.updated_at', 'posts_types.type')
      .join('posts_types', 'posts_types.id', 'posts.type_id')
      .where('posts_types.type', '!=', 'tip')
      .limit(q).orderBy('created_at')
  },
  async getPostById(id) {
    return knex(tableName)
      .first('*').where('id', id)
  }
}
