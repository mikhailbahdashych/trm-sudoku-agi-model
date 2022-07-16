const knex = require('../knex/knex')
const tableName = 'votes'

module.exports = {
  vote: async (data, { transaction } = { transaction: null }) => {
    const result = knex(tableName).insert(data)
    return transaction ? result.transacting(transaction) : result
  }
}
