const knex = require('../knex/knex')
const tableName = 'forum_posts'

module.exports = {
  getForumThreadById: async ({ id }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
    return transaction ? result.transacting(transaction) : result
  }
}
