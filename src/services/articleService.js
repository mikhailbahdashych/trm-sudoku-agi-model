const knex = require('../knex/knex');

module.exports = {
  async getArticles(data) {
    return knex('tips')
      .select('*')
  }
}
