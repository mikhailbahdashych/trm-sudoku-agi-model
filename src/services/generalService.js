const knex = require('../knex/knex')
const uuid = require('uuid');
const tableName = 'posts'

module.exports = {
  async getLatestReleases(q) {
    return knex('posts')
      .select('posts.id', 'posts.title', 'posts.plot', 'posts.text', 'posts.created_at', 'posts.updated_at', 'posts_types.type')
      .join('posts_types', 'posts_types.id', 'posts.type_id')
      .where('posts_types.type', '!=', 'tip')
      .limit(q).orderBy('created_at', 'desc')

  },
  async getPostById(id) {
    return knex(tableName)
      .first('*').where('id', id)
  },
  async getPostsByCategory(category, from, to) {
    return knex(tableName)
      .select('posts.id', 'posts.title', 'posts.plot', 'posts.text', 'posts.created_at', 'posts.updated_at', 'posts_types.type')
      .join('posts_types', 'posts_types.id', 'posts.type_id')
      .where('posts_types.type', category)
      .orderBy('posts.created_at', 'desc')
      .modify((qb) => {
        if (from !== 'null' && to !== 'null') {
          qb.where('posts.created_at', '>=', `${from} 00:00:00`)
          qb.where('posts.created_at', '<=', `${to} 23:59:59`)
        }
      })
  }
}
