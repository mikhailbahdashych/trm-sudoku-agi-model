const knex = require('../knex/knex')
const tableName = 'blog_posts'

module.exports = {
  getBlogPost: async ({ id, title }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
    return transaction ? result.transacting(transaction) : result
  }
}
