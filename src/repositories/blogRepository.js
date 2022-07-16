const knex = require('../knex/knex')
const tableName = ''

module.exports = {
  getBlogPostById: async ({ id }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
    return transaction ? result.transacting(transaction) : result
  }
}
