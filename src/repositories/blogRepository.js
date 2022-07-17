const knex = require('../knex/knex')
const tableName = 'blog_posts'

module.exports = {
  getBlogPostById: async ({ id }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
    return transaction ? result.transacting(transaction) : result
  }
}
