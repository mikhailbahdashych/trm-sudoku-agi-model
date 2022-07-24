const knex = require('../knex/knex')
const tableName = 'forum_posts'

module.exports = {
  getUserForumPosts: async ({ userId }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
    return transaction ? result.transacting(transaction) : result
  },
  getForumThread: async ({ id, title }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
    return transaction ? result.transacting(transaction) : result
  },
}
