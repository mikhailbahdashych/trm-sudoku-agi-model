const knex = require('../knex/knex')
const tableName = ''

module.exports = {
  getQuestionById: async ({ id }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
    return transaction ? result.transacting(transaction) : result
  }
}
