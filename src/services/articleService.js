const knex = require('../knex/knex');
const tableName = 'articles'

module.exports = {
  async getArticles(q) {
    return knex(tableName)
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(q)
  },
  async getArticleById(id) {
    return knex(tableName)
      .first('*').where('id', id)
  }
}
