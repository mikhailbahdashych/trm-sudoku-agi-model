const knex = require('../knex/knex')
const tableName = 'blog_posts'

module.exports = {
  getUserBlogPosts: async ({ userId }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
    return transaction ? result.transacting(transaction) : result
  },
  getBlogPost: async ({ id, title }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
    return transaction ? result.transacting(transaction) : result
  }
}
