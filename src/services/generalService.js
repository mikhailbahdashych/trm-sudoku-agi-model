const knex = require('../knex/knex')
const tableName = 'posts'

module.exports = {
  async getSelectedReleases(q) {
    return knex(tableName)
      .select('posts.id', 'posts.title', 'posts.plot', 'posts.text', 'posts.created_at', 'posts.updated_at', 'posts_types.type', 'posts.cover')
      .join('posts_types', 'posts_types.id', 'posts.type_id')
      .where('posts_types.type', '!=', 'tip')
      .andWhere('posts.selected', 1)
      .andWhere('posts.hold',0)
      .limit(q).orderBy('created_at', 'desc')
  },
  async getLatestReleases(q) {
    return knex(tableName)
      .select('posts.id', 'posts.title', 'posts.plot', 'posts.text', 'posts.created_at', 'posts.updated_at', 'posts_types.type', 'posts.cover')
      .join('posts_types', 'posts_types.id', 'posts.type_id')
      .where('posts_types.type', '!=', 'tip')
      .andWhere('posts.hold',0)
      .limit(q).orderBy('created_at', 'desc')
  },
  async getPostById(id) {
    return knex(tableName)
      .first('*').where('id', id)
  },
  async getPostsByCategory(category, from, to) {
    return knex(tableName)
      .select('posts.id', 'posts.title', 'posts.plot', 'posts.text', 'posts.created_at', 'posts.updated_at', 'posts_types.type', 'posts.cover')
      .join('posts_types', 'posts_types.id', 'posts.type_id')
      .where('posts_types.type', category)
      .andWhere('posts.hold',0)
      .orderBy('posts.created_at', 'desc')
      .modify((qb) => {
        if (from !== 'null' && to !== 'null') {
          qb.where('posts.created_at', '>=', `${from} 00:00:00`)
          qb.where('posts.created_at', '<=', `${to} 23:59:59`)
        }
      })
  },
  async search(input) {
    return knex(tableName)
      .select('posts.*', 'posts_types.type')
      .where('title', 'like', `%${input}%`)
      .andWhere('posts.hold',0)
      .join('posts_types', 'posts_types.id', 'posts.type_id')
      .limit(5)
  }
}
