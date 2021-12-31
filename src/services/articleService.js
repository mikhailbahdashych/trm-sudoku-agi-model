const knex = require('../knex/knex');

module.exports = {
  async getArticles(q) {
    return knex('articles')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(q)
  },
  async getArticleById(id) {
    return knex('articles')
      .first('*').where('id', id)
  }
}
