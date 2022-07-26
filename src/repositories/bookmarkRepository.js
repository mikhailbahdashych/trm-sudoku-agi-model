const knex = require('../knex/knex')
const tableName = 'bookmarks'

module.exports = {
  addBookmark: async (data, { transaction } = { transaction: null }) => {
    const result = knex(tableName).insert(data)
    return transaction ? result.transacting(transaction) : result
  },
  getBookmarks: async ({ userId }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('user_id', userId)
    return transaction ? result.transacting(transaction) : result
  },
  deleteBookmark: async ({ id, userId }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('id', id)
      .andWhere('user_id', userId)
      .del()
    return transaction ? result.transacting(transaction) : result
  }
}
