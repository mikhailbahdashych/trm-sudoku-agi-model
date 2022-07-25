const knex = require('../knex/knex')
const tableName = 'post_types'

module.exports = {
  getPostTypeIdByType: async ({ type }, { transaction } = { transaction: null }) => {
    const result = knex(tableName)
      .where('type', type)
      .first('id')
    return transaction ? result.transacting(transaction) : result
  }
}
